// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Forces compilation of ERC1967Proxy for test usage
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ImportsProxyDummy {
    // Intentionally empty — forces Truffle to compile ERC1967Proxy for tests.
}
