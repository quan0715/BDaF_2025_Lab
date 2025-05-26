// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title FixedRateSwap
 * @dev 固定兌換比例 1:3 的代幣交換合約
 * TokenA : TokenB = 1 : 3
 * 1 TokenA 可以兌換 3 TokenB
 * 3 TokenB 可以兌換 1 TokenA
 */
contract FixedRateSwap is Ownable {
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    // 兌換比例：1 TokenA = 3 TokenB
    uint256 public constant RATE_A_TO_B = 3;
    uint256 public constant RATE_B_TO_A = 1;
    
    // 事件
    event SwapAToB(address indexed user, uint256 amountA, uint256 amountB);
    event SwapBToA(address indexed user, uint256 amountB, uint256 amountA);
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);
    
    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        require(_tokenA != address(0) && _tokenB != address(0), unicode"代幣地址不能為零地址");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev 將 TokenA 兌換為 TokenB
     * @param amountA 要兌換的 TokenA 數量
     */
    function swapAToB(uint256 amountA) external {
        require(amountA > 0, unicode"兌換數量必須大於 0");
        
        uint256 amountB = amountA * RATE_A_TO_B;
        
        // 檢查合約是否有足夠的 TokenB
        require(tokenB.balanceOf(address(this)) >= amountB, unicode"合約 TokenB 餘額不足");
        
        // 從用戶轉入 TokenA
        require(tokenA.transferFrom(msg.sender, address(this), amountA), unicode"TokenA 轉入失敗");
        
        // 向用戶轉出 TokenB
        require(tokenB.transfer(msg.sender, amountB), unicode"TokenB 轉出失敗");
        
        emit SwapAToB(msg.sender, amountA, amountB);
    }
    
    /**
     * @dev 將 TokenB 兌換為 TokenA
     * @param amountB 要兌換的 TokenB 數量（必須是 3 的倍數）
     */
    function swapBToA(uint256 amountB) external {
        require(amountB > 0, unicode"兌換數量必須大於 0");
        require(amountB % RATE_A_TO_B == 0, unicode"TokenB 數量必須是 3 的倍數");
        
        uint256 amountA = amountB / RATE_A_TO_B;
        
        // 檢查合約是否有足夠的 TokenA
        require(tokenA.balanceOf(address(this)) >= amountA, unicode"合約 TokenA 餘額不足");
        
        // 從用戶轉入 TokenB
        require(tokenB.transferFrom(msg.sender, address(this), amountB), unicode"TokenB 轉入失敗");
        
        // 向用戶轉出 TokenA
        require(tokenA.transfer(msg.sender, amountA), unicode"TokenA 轉出失敗");
        
        emit SwapBToA(msg.sender, amountB, amountA);
    }
    
    /**
     * @dev 添加流動性（只有合約擁有者可以調用）
     * @param amountA TokenA 數量
     * @param amountB TokenB 數量
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, unicode"流動性數量必須大於 0");
        
        // 從擁有者轉入代幣到合約
        require(tokenA.transferFrom(msg.sender, address(this), amountA), unicode"TokenA 轉入失敗");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), unicode"TokenB 轉入失敗");
        
        emit LiquidityAdded(msg.sender, amountA, amountB);
    }
    
    /**
     * @dev 移除流動性（只有合約擁有者可以調用）
     * @param amountA TokenA 數量
     * @param amountB TokenB 數量
     */
    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 || amountB > 0, unicode"至少需要移除一種代幣");
        
        if (amountA > 0) {
            require(tokenA.balanceOf(address(this)) >= amountA, unicode"合約 TokenA 餘額不足");
            require(tokenA.transfer(msg.sender, amountA), unicode"TokenA 轉出失敗");
        }
        
        if (amountB > 0) {
            require(tokenB.balanceOf(address(this)) >= amountB, unicode"合約 TokenB 餘額不足");
            require(tokenB.transfer(msg.sender, amountB), unicode"TokenB 轉出失敗");
        }
        
        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }
    
    /**
     * @dev 查看合約中的代幣餘額
     */
    function getReserves() external view returns (uint256 reserveA, uint256 reserveB) {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }
    
    /**
     * @dev 計算兌換後能得到的代幣數量
     * @param amountIn 輸入代幣數量
     * @param tokenIn 輸入代幣地址
     */
    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256 amountOut) {
        require(amountIn > 0, unicode"輸入數量必須大於 0");
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), unicode"無效的代幣地址");
        
        if (tokenIn == address(tokenA)) {
            amountOut = amountIn * RATE_A_TO_B;
        } else {
            require(amountIn % RATE_A_TO_B == 0, unicode"TokenB 數量必須是 3 的倍數");
            amountOut = amountIn / RATE_A_TO_B;
        }
    }
} 