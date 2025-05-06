// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMock{
    function mocking() external;
}

interface INo3ProofOfProxy {
    function currentId() external view returns (uint256);
    function registeredContracts(address) external view returns (bool);
    function registerContract(address contractAddress) external;
    function testMock() external;
    function balanceOf(address owner) external view returns (uint256);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract MockContract is IMock {
    bool public shouldRevert = true;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setShouldRevert(bool _shouldRevert) external {
        if (msg.sender != owner) revert("Only owner can call this function");
        shouldRevert = _shouldRevert;
    }

    function mocking() external view override {
        if (shouldRevert) {
            revert("Mocking failed");
        }
    }
    
    function callTestMock(address pop) external {
        INo3ProofOfProxy(pop).testMock();
        
        // 取得最新 tokenId 並轉給 owner
        uint256 tokenId = INo3ProofOfProxy(pop).currentId();
        INo3ProofOfProxy(pop).transferFrom(address(this), owner, tokenId);
    }
}


