// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestTokenA is ERC20, Ownable {
    constructor() ERC20("Test Token A", "TTA") Ownable(msg.sender) {
        // 鑄造 1,000,000 個代幣給部署者
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    /**
     * @dev 允許擁有者鑄造新代幣
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 允許任何人鑄造代幣（僅用於測試）
     */
    function mintForTest(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 