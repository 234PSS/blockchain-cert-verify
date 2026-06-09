.PHONY: all help setup compile deploy ganache-start ganache-stop \
        test-contracts test-backend test lint lint-js lint-sol \
        coverage security deep-clean clean reset help \
        frontend-install frontend-dev frontend-build frontend-start \
        start-full docker-up docker-down docker-build

# ─── Configuration ───────────────────────────────────────────────────────────
GANACHE_PORT   ?= 7545
GANACHE_URL    ?= http://127.0.0.1:$(GANACHE_PORT)
SOLC_VERSION   ?= 0.8.19
REPORT_DIR     ?= reports

# Colors
BOLD  := \033[1m
GREEN := \033[32m
YELLOW:= \033[33m
RED   := \033[31m
CYAN  := \033[36m
RESET := \033[0m

# ─── Default ─────────────────────────────────────────────────────────────────
all: setup compile lint test

# ─── Help ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(BOLD)CertificateRegistryV2 — Makefile$(RESET)"
	@echo ""
	@echo "  $(GREEN)make setup$(RESET)         Install all dependencies"
	@echo "  $(GREEN)make compile$(RESET)       Compile Solidity contracts"
	@echo "  $(GREEN)make deploy$(RESET)        Deploy contracts to local network (auto-starts ganache)"
	@echo "  $(GREEN)make test$(RESET)          Run ALL tests (contract + backend)"
	@echo "  $(GREEN)make test-contracts$(RESET) Run only Solidity contract tests"
	@echo "  $(GREEN)make test-backend$(RESET)  Run only backend (Jest) tests"
	@echo "  $(GREEN)make lint$(RESET)          Run all linters (JS + Solidity)"
	@echo "  $(GREEN)make lint-js$(RESET)       Run ESLint on backend"
	@echo "  $(GREEN)make lint-sol$(RESET)      Run solhint on contracts (if available)"
	@echo "  $(GREEN)make coverage$(RESET)      Run test coverage report"
	@echo "  $(GREEN)make security$(RESET)      Run Slither security analysis (if installed)"
	@echo "  $(GREEN)make ganache-start$(RESET) Start local Ganache instance"
	@echo "  $(GREEN)make ganache-stop$(RESET)  Stop Ganache"
	@echo "  $(GREEN)make clean$(RESET)         Remove build artifacts"
	@echo "  $(GREEN)make reset$(RESET)         Full reset: clean + node_modules + build"
	@echo "  ---"
	@echo "  $(GREEN)make frontend-install$(RESET) Install frontend dependencies"
	@echo "  $(GREEN)make frontend-dev$(RESET)    Start Next.js dev server"
	@echo "  $(GREEN)make frontend-build$(RESET)  Build Next.js for production"
	@echo "  $(GREEN)make frontend-start$(RESET)  Start Next.js production server"
	@echo "  ---"
	@echo "  $(GREEN)make setup-zk$(RESET)       Run ZK trusted setup (requires Rust + circom)"
	@echo "  ---"
	@echo "  $(GREEN)make start-full$(RESET)     Start full stack (Ganache + Backend + Frontend)"
	@echo "  $(GREEN)make docker-build$(RESET)   Build all Docker images"
	@echo "  $(GREEN)make docker-up$(RESET)      Start all services via Docker Compose"
	@echo "  $(GREEN)make docker-down$(RESET)    Stop all Docker services"
	@echo "  $(GREEN)make docker-logs$(RESET)    Tail Docker logs"
	@echo ""

# ─── Setup ───────────────────────────────────────────────────────────────────
setup:
	@echo "$(BOLD)$(CYAN)[setup]$(RESET) Installing npm dependencies..."
	@npm install
	@echo "$(GREEN)✓ npm dependencies installed$(RESET)"
	@echo "$(BOLD)$(CYAN)[setup]$(RESET) Installing truffle-assertions..."
	@npm install --save-dev truffle-assertions 2>/dev/null || true
	@echo "$(GREEN)✓ Setup complete$(RESET)"

setup-full: setup
	@echo "$(BOLD)$(CYAN)[setup]$(RESET) Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(RESET)"

# ─── Ganache ─────────────────────────────────────────────────────────────────
ganache-start:
	@echo "$(BOLD)$(CYAN)[ganache]$(RESET) Starting Ganache on port $(GANACHE_PORT)..."
	@npx ganache --port $(GANACHE_PORT) --networkId 5777 --deterministic \
		--miner.blockGasLimit 100000000 \
		> /tmp/ganache-$(GANACHE_PORT).log 2>&1 & \
		echo $$! > /tmp/ganache-$(GANACHE_PORT).pid
	@sleep 3
	@if curl -s -X POST -H "Content-Type: application/json" \
		-d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
		$(GANACHE_URL) > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Ganache ready on $(GANACHE_URL)$(RESET)"; \
	else \
		echo "$(RED)✗ Ganache failed to start$(RESET)"; \
		exit 1; \
	fi

ganache-stop:
	@echo "$(BOLD)$(CYAN)[ganache]$(RESET) Stopping Ganache..."
	@if [ -f /tmp/ganache-$(GANACHE_PORT).pid ]; then \
		kill $$(cat /tmp/ganache-$(GANACHE_PORT).pid) 2>/dev/null || true; \
		rm -f /tmp/ganache-$(GANACHE_PORT).pid; \
		echo "$(GREEN)✓ Ganache stopped$(RESET)"; \
	else \
		echo "$(YELLOW) Ganache was not running$(RESET)"; \
	fi

# ─── Compile ─────────────────────────────────────────────────────────────────
compile:
	@echo "$(BOLD)$(CYAN)[compile]$(RESET) Compiling Solidity contracts..."
	@npx truffle compile --all
	@echo "$(GREEN)✓ Compilation successful$(RESET)"

# ─── Deploy ──────────────────────────────────────────────────────────────────
deploy: compile
	@echo "$(BOLD)$(CYAN)[deploy]$(RESET) Checking Ganache..."
	@if ! curl -s -X POST -H "Content-Type: application/json" \
		-d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
		$(GANACHE_URL) > /dev/null 2>&1; then \
		echo "$(YELLOW) Ganache not running — starting it...$(RESET)"; \
		$(MAKE) ganache-start; \
	fi
	@echo "$(BOLD)$(CYAN)[deploy]$(RESET) Running Truffle migrations..."
	@npx truffle migrate --network development --reset 2>&1
	@echo "$(GREEN)✓ Deployment successful$(RESET)"

# ─── Frontend ─────────────────────────────────────────────────────────────────
frontend-install:
	@echo "$(BOLD)$(CYAN)[frontend]$(RESET) Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(RESET)"

frontend-dev:
	@echo "$(BOLD)$(CYAN)[frontend]$(RESET) Starting Next.js dev server..."
	@cd frontend && npm run dev

frontend-build:
	@echo "$(BOLD)$(CYAN)[frontend]$(RESET) Building Next.js frontend..."
	@cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend build complete$(RESET)"

frontend-start:
	@echo "$(BOLD)$(CYAN)[frontend]$(RESET) Starting Next.js production server..."
	@cd frontend && npm start

# ─── ZK Setup ─────────────────────────────────────────────────────────────────
setup-zk:
	@echo "$(BOLD)$(CYAN)[zk]$(RESET) Running ZK trusted setup..."
	@echo "$(YELLOW)  Prerequisites: Rust, circom, snarkjs${RESET}"
	@echo "$(YELLOW}  See circuits/certMembership.circom and scripts/setup-zk.sh${RESET}"
	@echo ""
	@bash scripts/setup-zk.sh
	@echo "$(GREEN)✓ ZK trusted setup complete$(RESET)"

# ─── Full Stack ───────────────────────────────────────────────────────────────
start-full:
	@echo "$(BOLD)$(CYAN)[full]$(RESET) Starting full stack (Ganache + Backend + Frontend)..."
	@bash scripts/start.sh

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-build:
	@echo "$(BOLD)$(CYAN)[docker]$(RESET) Building Docker images..."
	@docker compose build
	@echo "$(GREEN)✓ Docker images built$(RESET)"

docker-up:
	@echo "$(BOLD)$(CYAN)[docker]$(RESET) Starting all services with Docker Compose..."
	@docker compose up -d
	@echo "$(GREEN)✓ All services started$(RESET)"
	@echo "  Frontend: http://localhost:3001"
	@echo "  Backend:  http://localhost:3000"
	@echo "  Ganache:  http://localhost:7545"

docker-down:
	@echo "$(BOLD)$(CYAN)[docker]$(RESET) Stopping all Docker services..."
	@docker compose down
	@echo "$(GREEN)✓ All services stopped$(RESET)"

docker-logs:
	@docker compose logs -f

# ─── Tests ───────────────────────────────────────────────────────────────────
test-contracts:
	@echo "$(BOLD)$(CYAN)[test:contracts]$(RESET) Checking Ganache..."
	@if ! curl -s -X POST -H "Content-Type: application/json" \
		-d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
		$(GANACHE_URL) > /dev/null 2>&1; then \
		echo "$(YELLOW) Ganache not running — starting it...$(RESET)"; \
		$(MAKE) ganache-start; \
	fi
	@echo "$(BOLD)$(CYAN)[test:contracts]$(RESET) Running Truffle contract tests..."
	@npx truffle test --network development 2>&1; \
	status=$$?; \
	if [ $$status -eq 0 ]; then \
		echo "$(GREEN)✓ All contract tests pass$(RESET)"; \
	else \
		echo "$(RED)✗ Contract test failures$(RESET)"; \
		exit $$status; \
	fi

test-backend:
	@echo "$(BOLD)$(CYAN)[test:backend]$(RESET) Running Jest backend tests..."
	@npx jest --runInBand --forceExit 2>&1; \
	status=$$?; \
	if [ $$status -eq 0 ]; then \
		echo "$(GREEN)✓ All backend tests pass$(RESET)"; \
	else \
		echo "$(RED)✗ Backend test failures$(RESET)"; \
		exit $$status; \
	fi

test: test-contracts test-backend
	@echo "$(BOLD)$(GREEN)=== ALL TESTS PASS ===$(RESET)"

coverage:
	@echo "$(BOLD)$(CYAN)[coverage]$(RESET) Running coverage..."
	@mkdir -p $(REPORT_DIR)
	@npx jest --runInBand --forceExit --coverage \
		--coverageDirectory=$(REPORT_DIR)/coverage 2>&1; \
	status=$$?; \
	if [ $$status -eq 0 ]; then \
		echo "$(GREEN)✓ Coverage report generated at $(REPORT_DIR)/coverage$(RESET)"; \
	else \
		echo "$(RED)✗ Coverage run had failures$(RESET)"; \
		exit $$status; \
	fi

# ─── Linting ─────────────────────────────────────────────────────────────────
lint-js:
	@echo "$(BOLD)$(CYAN)[lint:js]$(RESET) Running ESLint..."
	@npx eslint src/ --max-warnings 0 2>&1; \
	status=$$?; \
	if [ $$status -eq 0 ]; then \
		echo "$(GREEN)✓ ESLint passed$(RESET)"; \
	else \
		echo "$(RED)✗ ESLint found errors$(RESET)"; \
		exit $$status; \
	fi

lint-sol:
	@echo "$(BOLD)$(CYAN)[lint:sol]$(RESET) Checking for solhint..."
	@if npx solhint --version > /dev/null 2>&1; then \
		npx solhint 'contracts/**/*.sol' 2>&1; \
		status=$$?; \
		if [ $$status -eq 0 ]; then \
			echo "$(GREEN)✓ solhint passed$(RESET)"; \
		else \
			echo "$(RED)✗ solhint found issues$(RESET)"; \
			exit $$status; \
		fi; \
	else \
		echo "$(YELLOW) solhint not installed — skipping$(RESET)"; \
	fi

lint: lint-js lint-sol

# ─── Security ────────────────────────────────────────────────────────────────
security:
	@echo "$(BOLD)$(CYAN)[security]$(RESET) Checking for Slither..."
	@if which slither > /dev/null 2>&1; then \
		echo "Running Slither analysis..."; \
		mkdir -p $(REPORT_DIR); \
		slither . --json $(REPORT_DIR)/slither-report.json 2>&1 || true; \
		slither . --print human-summary 2>&1; \
		echo "$(GREEN)✓ Slither analysis complete$(RESET)"; \
	else \
		echo "$(YELLOW) Slither not installed. Install with: pip3 install slither-analyzer$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)$(CYAN)[security]$(RESET) Checking for Mythril..."
	@if which myth > /dev/null 2>&1 || which mythril > /dev/null 2>&1; then \
		echo "Running Mythril analysis..."; \
		myth analyze build/contracts/CertificateRegistryV2.json 2>&1 || \
		mythril a build/contracts/CertificateRegistryV2.json 2>&1 || true; \
		echo "$(GREEN)✓ Mythril analysis complete$(RESET)"; \
	else \
		echo "$(YELLOW) Mythril not installed. Install with: pip3 install mythril$(RESET)"; \
	fi

# ─── Clean ───────────────────────────────────────────────────────────────────
clean:
	@echo "$(BOLD)$(CYAN)[clean]$(RESET) Removing build artifacts..."
	@rm -rf build/
	@echo "$(GREEN)✓ Clean complete$(RESET)"

deep-clean: clean
	@echo "$(BOLD)$(CYAN)[clean]$(RESET) Removing node_modules..."
	@rm -rf node_modules/
	@echo "$(GREEN)✓ Deep clean complete$(RESET)"

reset: deep-clean
	@$(MAKE) setup
	@$(MAKE) compile
	@echo "$(GREEN)✓ Full reset complete$(RESET)"
