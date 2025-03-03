// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract Requirements:
// 1. This contract receives ETH and emits event to record that certain address has sent it ETH for how much.
// 2. The events emitted should include the address and the amount received.
// 3. There should be one specific address that can withdraw all those funds received
// 4. no other addresses should be able to withdraw the funds stored in the contract

contract Contract {
    // 定義 Received 事件 
    // 事件名稱: Received
    // 事件參數:
    // - sender: 發送者地址
    // - amount: 接收的金額
    event Received(address indexed sender, uint256 amount);
    event LogMessage(string message);
    // 定義 owner 變數
    // 變數名稱: owner
    // 變數類型: address
    address public owner;

    // 建構子
    // 設定 owner 為合約的發送者
    constructor() {
        owner = msg.sender;
        // log the owner address
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }    
    
    receive() external payable {
        uint amount = msg.value;
        address sender = msg.sender;        
        require(amount > 0, "Amount must be greater than 0");
        // emit the Received event
        emit Received(sender, amount);
    }
}
