// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenLock is Ownable {

    IERC20 public rewardToken;
    uint256 public startTime = 0;
    uint256 public endTime = 0;
    struct UserLock {
        uint256 amount;
        bool isLocked;
        bool isTaken;
        bool isRewarded;
    }
    // user address => user lock
    mapping(address => UserLock) public userLocks;
    // trade ETH amount
    uint256 public tradeETHAmount = 0;

    constructor(address _tokenAddress) Ownable(msg.sender) {
        rewardToken = IERC20(_tokenAddress);
    }

    function setStartTime(uint256 _startTime) external onlyOwner {
        require(_startTime > block.timestamp, "Start time must be in the future");
        startTime = _startTime;
    }

    function setEndTime(uint256 _endTime) external onlyOwner {
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_endTime > startTime, "End time must be after start time");
        endTime = _endTime;
    }

    function _checkTimeSet() internal view returns (bool) {
        return startTime > 0 && endTime > 0;
    }


    event Lock(address indexed user, uint256 amount);
    event Unlock(address indexed user, uint256 amount, uint256 reward);
    event FundsTraded(address indexed user, uint256 amount);
    event LockingStarted(uint256 startTime);
    event LockingEnded(uint256 endTime);

    function lock() external payable {
        require(_checkTimeSet(), "Time not set by owner");
        require(block.timestamp < startTime, "Lock period has ended");
        require(msg.value > 0, "Must lock some ETH");
        require(!isUserLocked(msg.sender), "Already locked ETH");
        
        userLocks[msg.sender] = UserLock({
            amount: msg.value,
            isLocked: true,
            isTaken: false,
            isRewarded: false
        });
        
        emit Lock(msg.sender, msg.value);
    }

    function tradeUserFunds(address user) external onlyOwner {
        require(userLocks[user].isLocked, "No ETH locked for this user");
        require(!userLocks[user].isTaken, "ETH already taken");
        
        uint256 amount = userLocks[user].amount;
        userLocks[user].isTaken = true;
        tradeETHAmount += amount;
        emit FundsTraded(user, amount);
    }

    function unlock() external {
        require(block.timestamp > endTime, "Lock period not over");
        require(isUserLocked(msg.sender), "No ETH locked");
        require(!userLocks[msg.sender].isRewarded, "Already rewarded");
        
        UserLock storage userLock = userLocks[msg.sender];
        uint256 reward;
        uint256 ethToReturn = 0;
        
        if (userLock.isTaken) {
            // 如果 ETH 被擁有者拿走，獎勵 = 1000 + (ETH 量 * 2500)
            reward = 1000 * 10**18 + (userLock.amount * 2500);
        } else {
            // 如果 ETH 未被拿走，獎勵 = 1000，並返還 ETH
            reward = 1000 * 10**18;
            ethToReturn = userLock.amount;
        }
        
        // 發送獎勵代幣
        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        
        // 如果有 ETH 要返還，則返還
        if (ethToReturn > 0) {
            (bool success, ) = msg.sender.call{value: ethToReturn}("");
            userLock.amount = 0;   
            require(success, "ETH transfer failed");
        }
        
        // 標記為已獎勵
        userLock.isRewarded = true;
        
        // 發出解鎖事件
        emit Unlock(msg.sender, ethToReturn, reward);
    }

    function getETH(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        require(_amount <= tradeETHAmount, "Insufficient trade ETH amount");
        tradeETHAmount -= _amount; // update trade ETH amount
        // transfer ETH to owner
        payable(msg.sender).transfer(_amount);
    }

    function isUserLocked(address user) public view returns (bool) {
        return userLocks[user].isLocked;
    }

    function getUserLock(address user) public view returns (
        uint256 amount,
        bool isLocked,
        bool isTaken,
        bool isRewarded
    ) {
        UserLock storage userLock = userLocks[user];
        return (
            userLock.amount,
            userLock.isLocked,
            userLock.isTaken,
            userLock.isRewarded
        );
    }

} 