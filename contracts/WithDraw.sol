// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


//write a smart contract that can withdraw any ERC20 tokens from it by its owner
contract WithDrawToken is Ownable {
    
    ERC20 public token;

    constructor(address _tokenAddress) Ownable(tx.origin) {
        token = ERC20(_tokenAddress);
    }
    
    function withdrawToken(uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");
        token.transfer(msg.sender, amount);
    }

    // get creationCode
   
}
