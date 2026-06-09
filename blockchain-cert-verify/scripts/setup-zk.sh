#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CIRCUITS_DIR="$PROJECT_DIR/circuits"
BUILD_DIR="$CIRCUITS_DIR/build"

RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${CYAN}=== ZK Trusted Setup for CertMembership ===${RESET}"
echo ""

mkdir -p "$BUILD_DIR"

# ─── Check Prerequisites ──────────────────────────────────────────────────────
PREREQ_OK=true

if ! command -v circom &>/dev/null; then
    echo -e "  ${YELLOW}circom not found.${RESET}"
    if command -v cargo &>/dev/null; then
        echo -e "  ${CYAN}Compiling circom from source (cargo)...${RESET}"
        if [ -d /tmp/circom-src ]; then
            rm -rf /tmp/circom-src
        fi
        git clone --depth 1 https://github.com/iden3/circom.git /tmp/circom-src 2>&1 | tail -1
        cd /tmp/circom-src
        cargo build --release 2>&1 | tail -3
        cargo install --path circom 2>&1 | tail -3
        cd "$PROJECT_DIR"
        rm -rf /tmp/circom-src
    else
        echo -e "  ${RED}Rust/Cargo not installed. Install it first:${RESET}"
        echo -e "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo -e "    rustup install stable"
        echo -e "  ${YELLOW}Or install circom via pre-built binary:${RESET}"
        echo -e "    https://github.com/iden3/circom/releases"
        PREREQ_OK=false
    fi
else
    echo -e "  ${GREEN}✓ circom $(circom --version)${RESET}"
fi

SNARKJS_BIN=""
if command -v snarkjs &>/dev/null; then
    SNARKJS_BIN="snarkjs"
    echo -e "  ${GREEN}✓ snarkjs (global)${RESET}"
elif [ -f "$PROJECT_DIR/node_modules/.bin/snarkjs" ]; then
    SNARKJS_BIN="$PROJECT_DIR/node_modules/.bin/snarkjs"
    echo -e "  ${GREEN}✓ snarkjs (local: node_modules/.bin/snarkjs)${RESET}"
else
    echo -e "  ${YELLOW}snarkjs not found. Installing from npm...${RESET}"
    npm install -g snarkjs 2>&1 | tail -1
    if command -v snarkjs &>/dev/null; then
        SNARKJS_BIN="snarkjs"
        echo -e "  ${GREEN}✓ snarkjs installed${RESET}"
    else
        echo -e "  ${RED}Failed to install snarkjs${RESET}"
        PREREQ_OK=false
    fi
fi

if [ "$PREREQ_OK" = false ]; then
    echo ""
    echo -e "${RED}Prerequisites missing. Aborting.${RESET}"
    exit 1
fi

# ─── Paths ────────────────────────────────────────────────────────────────────
CIRCUIT="$CIRCUITS_DIR/certMembership.circom"
R1CS="$BUILD_DIR/certMembership.r1cs"
WASM_DIR="$BUILD_DIR/certMembership_js"
WASM="$WASM_DIR/certMembership.wasm"
PTAU="$BUILD_DIR/powersOfTau28_hez_final_16.ptau"
ZKEY="$BUILD_DIR/certMembership_final.zkey"
VKEY="$BUILD_DIR/verification_key.json"
VERIFIER="$BUILD_DIR/PlonkVerifier.sol"

# ─── Step 1: Compile Circom ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}(1/4) Compiling circom circuit...${RESET}"
if [ -f "$R1CS" ] && [ -f "$WASM" ]; then
    echo -e "  ${GREEN}✓ Already compiled (R1CS + WASM exist)${RESET}"
else
    circom "$CIRCUIT" --r1cs="$R1CS" --wasm="$WASM" --sym -o "$BUILD_DIR" 2>&1 | sed 's/^/  /'
    echo -e "  ${GREEN}✓ Circuit compiled${RESET}"
fi

# ─── Step 2: Power of Tau ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}(2/4) Power of Tau (16 constraints)...${RESET}"
if [ -f "$PTAU" ]; then
    echo -e "  ${GREEN}✓ ptau file exists${RESET}"
else
    echo -e "  ${CYAN}Downloading powersOfTau28_hez_final_16.ptau (~200MB)...${RESET}"
    curl -L "https://hermez.s3.amazonaws.com/powersOfTau28_hez_final_16.ptau" -o "$PTAU" 2>&1 | tail -1
    echo -e "  ${GREEN}✓ ptau downloaded${RESET}"
fi

# ─── Step 3: Groth16 Setup ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}(3/4) Groth16 trusted setup phase 2...${RESET}"
if [ -f "$ZKEY" ] && [ -f "$VKEY" ]; then
    echo -e "  ${GREEN}✓ zkey + verification key already exist${RESET}"
else
    echo -e "  ${CYAN}Running groth16 setup (this may take a while)...${RESET}"
    $SNARKJS_BIN groth16 setup "$R1CS" "$PTAU" "$ZKEY" 2>&1 | sed 's/^/  /'
    $SNARKJS_BIN zkey export verificationkey "$ZKEY" "$VKEY" 2>&1 | sed 's/^/  /'
    echo -e "  ${GREEN}✓ Trusted setup complete${RESET}"
fi

# ─── Step 4: Solidity Verifier ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}(4/4) Generating Solidity verifier...${RESET}"
if [ -f "$VERIFIER" ]; then
    echo -e "  ${GREEN}✓ Solidity verifier already exists${RESET}"
else
    $SNARKJS_BIN zkey export solidityverifier "$ZKEY" "$VERIFIER" 2>&1 | sed 's/^/  /'
    echo -e "  ${GREEN}✓ Solidity verifier generated: ${VERIFIER}${RESET}"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}=== ZK Trusted Setup Complete ===${RESET}"
echo -e "  R1CS:        $R1CS"
echo -e "  WASM:        $WASM"
echo -e "  Proving Key: $ZKEY"
echo -e "  Verify Key:  $VKEY"
echo -e "  Verifier:    $VERIFIER"
echo ""

# Next: deploy the verifier contract
echo -e "${YELLOW}Next steps:${RESET}"
echo -e "  1. Deploy PlonkVerifier.sol to the blockchain"
echo -e "  2. Update CertificateRegistryV2 to reference the verifier"
echo -e "  3. Generate proofs via: snarkjs groth16 fullprove"
