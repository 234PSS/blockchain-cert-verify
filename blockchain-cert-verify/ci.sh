#!/usr/bin/env bash
# =============================================================================
#  CertificateRegistryV2 — Autonomous CI Pipeline
#  "Fire and forget": compiles, deploys, lints, tests, and self-heals.
#  Usage:
#    ./ci.sh                  # one-shot (exits on first failure)
#    ./ci.sh --auto           # retries + self-heal until 100% pass
#    ./ci.sh --auto --watch   # watch mode (poll + re-run on file changes)
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

AUTO_MODE=false
WATCH_MODE=false
MAX_RETRIES=10
REPORT_DIR="${ROOT_DIR}/reports"
PASS=false

# ─── Parse args ──────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --auto) AUTO_MODE=true ;;
    --watch) WATCH_MODE=true ;;
  esac
done

# ─── Colors ──────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
info() { echo -e "  ${CYAN}→${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; }

header() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${CYAN}  $1${RESET}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${RESET}"
  echo ""
}

# ─── Helpers ──────────────────────────────────────────────────────────────────
ensure_ganache() {
  if ! curl -s -X POST -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
       http://127.0.0.1:7545 > /dev/null 2>&1; then
    info "Starting Ganache..."
    npx ganache --port 7545 --networkId 5777 --deterministic \
      --miner.blockGasLimit 100000000 \
      > /tmp/ganache-ci.log 2>&1 &
    echo $! > /tmp/ganache-ci.pid
    sleep 4
    if curl -s -X POST -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
         http://127.0.0.1:7545 > /dev/null 2>&1; then
      ok "Ganache ready"
    else
      fail "Ganache failed to start"
      return 1
    fi
  else
    ok "Ganache already running"
  fi
}

stop_ganache() {
  if [ -f /tmp/ganache-ci.pid ]; then
    kill "$(cat /tmp/ganache-ci.pid)" 2>/dev/null || true
    rm -f /tmp/ganache-ci.pid
    info "Ganache stopped"
  fi
}

# ─── Pipeline Steps ──────────────────────────────────────────────────────────

step_setup() {
  header "STEP 1: Setup"
  npm install --silent 2>&1 | tail -1
  npm install --save-dev truffle-assertions 2>/dev/null || true
  mkdir -p "$REPORT_DIR"
  ok "Dependencies installed"
}

step_compile() {
  header "STEP 2: Compile Contracts"
  npx truffle compile --all 2>&1
  ok "Compilation successful"
}

step_lint() {
  header "STEP 3: Linting"
  local lint_ok=true

  # ESLint
  if npx eslint src/ --max-warnings 0 2>&1; then
    ok "ESLint passed"
  else
    fail "ESLint found errors"
    lint_ok=false
  fi

  # solhint (optional)
  if command -v npx && npx solhint --version > /dev/null 2>&1; then
    if npx solhint 'contracts/**/*.sol' 2>&1; then
      ok "solhint passed"
    else
      warn "solhint warnings (non-fatal)"
    fi
  fi

  $lint_ok
}

step_deploy() {
  header "STEP 4: Deploy"
  ensure_ganache
  npx truffle migrate --network development --reset 2>&1
  ok "Deployment successful"
}

step_test_contracts() {
  header "STEP 5: Contract Tests (Truffle/Mocha)"
  ensure_ganache
  local output
  output=$(npx truffle test --network development 2>&1)
  local exit_code=$?
  echo "$output"

  if [ $exit_code -eq 0 ]; then
    ok "All contract tests pass"
    return 0
  else
    fail "Contract test failures"
    echo "$output" > "$REPORT_DIR/contract-test-failure.log"
    return 1
  fi
}

step_test_backend() {
  header "STEP 6: Backend Tests (Jest)"
  local output
  output=$(npx jest --runInBand --forceExit 2>&1)
  local exit_code=$?
  echo "$output"

  if [ $exit_code -eq 0 ]; then
    ok "All backend tests pass"
    return 0
  else
    fail "Backend test failures"
    echo "$output" > "$REPORT_DIR/backend-test-failure.log"
    return 1
  fi
}

# ─── Self-Healing Engine ─────────────────────────────────────────────────────

auto_heal() {
  local failed_step="$1"
  local attempt="$2"

  header "🩺 SELF-HEAL ATTEMPT $attempt"

  case "$failed_step" in
    compile)
      warn "Compilation failed — checking for common issues..."
      if grep -q "Stack too deep" "$REPORT_DIR/compile-error.log" 2>/dev/null; then
        info "Stack too deep detected — ensuring viaIR is enabled..."
        # Already enabled in truffle-config
      fi
      if grep -q "ParserError" "$REPORT_DIR/compile-error.log" 2>/dev/null; then
        local line
        line=$(grep -oP ":\d+:" < "$REPORT_DIR/compile-error.log" | head -1 | tr -d ':')
        info "Parser error near line $line — review needed"
      fi
      ;;

    lint)
      warn "Lint failure detected — auto-fixing..."
      npx eslint src/ --fix 2>/dev/null || true
      ;;

    test-contracts|test_backend)
      warn "Test failure — diagnosing..."
      local logfile="$REPORT_DIR/contract-test-failure.log"
      [ "$failed_step" = "test_backend" ] && logfile="$REPORT_DIR/backend-test-failure.log"

      if grep -q "AssertionError" "$logfile" 2>/dev/null; then
        local assertion
        assertion=$(grep -oP "expected .+ to equal .+" "$logfile" | head -3)
        info "Assertion failures detected:"
        echo "$assertion"
      fi
      if grep -q "revert" "$logfile" 2>/dev/null; then
        warn "Some tests expected reverts — checking revert message logic..."
      fi
      if grep -q "Timeout" "$logfile" 2>/dev/null; then
        info "Timeout detected — may need to increase gas limits"
      fi
      ;;

    deploy)
      warn "Deployment failed — resetting..."
      npx truffle migrate --reset --network development 2>&1 || true
      ;;
  esac
}

# ─── Main Pipeline ───────────────────────────────────────────────────────────

run_pipeline() {
  local attempt=1
  local max_attempts=1
  $AUTO_MODE && max_attempts=$MAX_RETRIES

  while [ $attempt -le $max_attempts ]; do
    PASS=true

    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║  CertificateRegistryV2 — CI Pipeline (run #${attempt})       ║${RESET}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════╝${RESET}"
    echo ""

    step_setup || { PASS=false; auto_heal "setup" "$attempt"; }

    if $PASS; then
      step_compile 2>&1 | tee "$REPORT_DIR/compile-output.log" || {
        PASS=false
        npx truffle compile --all 2>&1 > "$REPORT_DIR/compile-error.log" || true
        auto_heal "compile" "$attempt"
      }
    fi

    if $PASS; then
      step_lint || { PASS=false; auto_heal "lint" "$attempt"; }
    fi

    if $PASS; then
      step_deploy || { PASS=false; auto_heal "deploy" "$attempt"; }
    fi

    if $PASS; then
      step_test_contracts || { PASS=false; auto_heal "test-contracts" "$attempt"; }
    fi

    if $PASS; then
      step_test_backend || { PASS=false; auto_heal "test_backend" "$attempt"; }
    fi

    # ─── Report ───
    echo ""
    header "📊 RESULTS (run #${attempt})"

    if $PASS; then
      echo -e "  ${GREEN}${BOLD}✔ ALL CHECKS PASSED${RESET}"
      echo ""
      echo -e "  ${BOLD}Compile:${RESET}    ${GREEN}OK${RESET}"
      echo -e "  ${BOLD}Lint:${RESET}       ${GREEN}OK${RESET}"
      echo -e "  ${BOLD}Deploy:${RESET}     ${GREEN}OK${RESET}"
      echo -e "  ${BOLD}Contracts:${RESET}  ${GREEN}OK${RESET}"
      echo -e "  ${BOLD}Backend:${RESET}    ${GREEN}OK${RESET}"
      echo ""
      echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════════${RESET}"
      echo -e "${BOLD}${GREEN}  CI PIPELINE COMPLETE — ZERO ERRORS${RESET}"
      echo -e "${BOLD}${GREEN}══════════════════════════════════════════════════════════════${RESET}"
      echo ""

      # Generate report
      {
        echo "# CI Pipeline Report"
        echo "Status: **PASS**"
        echo "Run: $(date -u)"
        echo "Attempts: $attempt"
        echo ""
        echo "## Checks"
        echo "- Compile: OK"
        echo "- Lint: OK"
        echo "- Deploy: OK"
        echo "- Contract Tests: OK"
        echo "- Backend Tests: OK"
      } > "$REPORT_DIR/ci-report.md"

      return 0
    else
      echo -e "  ${RED}${BOLD}✗ SOME CHECKS FAILED${RESET}"
      echo ""

      if ! $AUTO_MODE; then
        echo -e "  ${YELLOW}Use --auto for self-healing mode${RESET}"
        echo ""
        stop_ganache
        return 1
      fi

      attempt=$((attempt + 1))
      if [ $attempt -le $max_attempts ]; then
        echo -e "  ${YELLOW}Retrying... (${attempt}/${max_attempts})${RESET}"
        echo ""
        sleep 2
      fi
    fi
  done

  echo -e "  ${RED}Exhausted ${max_attempts} retries — pipeline failed${RESET}"
  stop_ganache
  return 1
}

# ─── Watch Mode ──────────────────────────────────────────────────────────────

watch_loop() {
  header "👀 WATCH MODE — Polling for file changes every 5s"
  local last_compile_hash
  last_compile_hash=$(find contracts/ test/ src/ -type f -exec md5sum {} + 2>/dev/null | md5sum)

  while true; do
    local new_hash
    new_hash=$(find contracts/ test/ src/ -type f -exec md5sum {} + 2>/dev/null | md5sum)
    if [ "$new_hash" != "$last_compile_hash" ]; then
      echo ""
      info "Change detected — re-running pipeline..."
      last_compile_hash="$new_hash"
      run_pipeline || true
    fi
    sleep 5
  done
}

# ─── Entrypoint ──────────────────────────────────────────────────────────────

cleanup() {
  stop_ganache
  echo ""
  info "CI pipeline terminated"
}

trap cleanup EXIT INT TERM

mkdir -p "$REPORT_DIR"

if $WATCH_MODE; then
  watch_loop
else
  run_pipeline
fi
