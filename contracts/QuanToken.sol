// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuanToken is ERC20, Ownable {
    constructor() ERC20("QuanToken", "QTK") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000 * 10**18);
    }
} 