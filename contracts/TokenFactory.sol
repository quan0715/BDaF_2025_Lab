// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract TokenFactory is Ownable {
    // 存儲已部署合約地址對應的所有者
    ERC20 public token;
    address public deployedContract;
    // 存儲已部署合約
    mapping(address => address) public deployedContracts;
    
    // 計算部署地址
    constructor(address _token) Ownable(msg.sender) {
        token = ERC20(_token);
    }

    // 計算部署地址 (接受外部字節碼)
    function computeAddress(bytes memory bytecode, bytes32 salt) 
        public view returns (address) {
        return Create2.computeAddress(salt, keccak256(bytecode));
    }
    
    // 部署合約 (接受外部字節碼)
    function deployContract(bytes memory bytecode, bytes32 salt) 
        external returns (address) {
        address addr = Create2.deploy(0, salt, bytecode);
        deployedContracts[addr] = msg.sender;
        return addr;
    }
} 