#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'
RESET='\033[0m'

echo -e "${BOLD}${CYAN}=== CertificateRegistryV2 — Full Stack Launcher ===${RESET}"
echo ""

check_port() {
    local port=$1
    if lsof -i:"$port" &>/dev/null 2>&1; then
        return 0
    fi
    return 1
}

wait_for_port() {
    local port=$1
    local service=$2
    local timeout=${3:-30}
    echo -ne "  Waiting for $service on port $port..."
    for i in $(seq 1 $timeout); do
        if check_port "$port"; then
            echo -e " ${GREEN}ready${RESET}"
            return 0
        fi
        sleep 1
        echo -ne "."
    done
    echo -e " ${RED}timeout${RESET}"
    return 1
}

start_service() {
    local name=$1
    local cmd=$2
    local logfile=$3
    local port=$4

    if check_port "$port" 2>/dev/null; then
        echo -e "  ${YELLOW}$name already running on port $port${RESET}"
        return 0
    fi

    echo -e "  ${CYAN}Starting $name...${RESET}"
    eval "$cmd" > "$logfile" 2>&1 &
    echo $! > "/tmp/${name}.pid"
}

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${RESET}"
    for pidfile in /tmp/ganache.pid /tmp/backend.pid /tmp/frontend.pid; do
        if [ -f "$pidfile" ]; then
            kill $(cat "$pidfile") 2>/dev/null || true
            rm -f "$pidfile"
        fi
    done
    echo -e "${GREEN}All services stopped${RESET}"
}
trap cleanup EXIT INT TERM

# ─── Start Ganache ────────────────────────────────────────────────────────────
if check_port 7545; then
    echo -e "  ${GREEN}✓ Ganache already running on port 7545${RESET}"
else
    echo -e "  ${CYAN}Starting Ganache...${RESET}"
    npx ganache --port 7545 --networkId 5777 --deterministic \
        > /tmp/ganache.log 2>&1 &
    echo $! > /tmp/ganache.pid
    wait_for_port 7545 "Ganache" 15 || {
        echo -e "  ${RED}Failed to start Ganache${RESET}"
        exit 1
    }
fi

# ─── Compile & Deploy ─────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}Compiling and deploying contracts...${RESET}"
npx truffle migrate --network development --reset 2>&1 | sed 's/^/    /'
echo -e "  ${GREEN}✓ Contracts deployed${RESET}"

# ─── Start Backend ────────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}Starting backend (port 3000)...${RESET}"
PORT=3000 node src/server.js > /tmp/backend.log 2>&1 &
echo $! > /tmp/backend.pid
wait_for_port 3000 "Backend" 15 || {
    echo -e "  ${RED}Failed to start backend${RESET}"
    tail -20 /tmp/backend.log | sed 's/^/    /'
    exit 1
}

# ─── Start Frontend ───────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}Starting frontend (port 3001)...${RESET}"
cd frontend
PORT=3001 node .next/standalone/server.js > /tmp/frontend.log 2>&1 &
echo $! > /tmp/frontend.pid
cd "$PROJECT_DIR"
wait_for_port 3001 "Frontend" 20 || {
    echo -e "  ${RED}Failed to start frontend${RESET}"
    tail -20 /tmp/frontend.log | sed 's/^/    /'
    exit 1
}

# ─── Show Status ──────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}=== All Services Running ===${RESET}"
echo -e "  ${GREEN}Ganache:${RESET}    http://127.0.0.1:7545"
echo -e "  ${GREEN}Backend:${RESET}    http://127.0.0.1:3000  (health: http://127.0.0.1:3000/health)"
echo -e "  ${GREEN}Frontend:${RESET}   http://127.0.0.1:3001"
echo ""
echo -e "  Logs:"
echo -e "    Ganache:  tail -f /tmp/ganache.log"
echo -e "    Backend:  tail -f /tmp/backend.log"
echo -e "    Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${RESET}"
echo ""

# Wait for any process to exit
wait
