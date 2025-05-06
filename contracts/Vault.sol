// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface DonationOnlyVaultInterface {
    function underlyingToken() public view returns (address);
    function sharePrice() public view returns (uint256);
    function deposit(uint256 amount) public;
    function withdraw(uint256 shares) public;
    function takeFeeAsOwner(uint256 amount) public;
}

contract DonationOnlyVault is Ownable, DonationOnlyVaultInterface {
    using SafeERC20 for IERC20;

    IERC20 public asset;
    ERC20 public shareToken;
    uint256 public totalShares;
    mapping(address => uint256) public shareBalance;

    constructor(address _underlyingToken) Ownable(msg.sender) {
        asset = IERC20(_underlyingToken);
        shareToken = new ERC20("Vault Share", "VSHARE");
    }

    function underlyingToken() public view override returns (address) {
        return address(asset);
    }

    function sharePrice() public view override returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (IERC20(asset).balanceOf(address(this)) * 1e18) / totalShares;
    }

    function deposit(uint256 amount) public override {
        uint256 sharesToMint = totalShares == 0
            ? amount
            : (amount * totalShares) / IERC20(asset).balanceOf(address(this));
        require(sharesToMint > 0, "Deposit too small");
        asset.safeTransferFrom(msg.sender, address(this), amount);
        shareBalance[msg.sender] += sharesToMint;
        totalShares += sharesToMint;
    }

    function withdraw(uint256 shares) public override {
        require(shareBalance[msg.sender] >= shares, "Not enough shares");
        uint256 amountToReturn = (IERC20(asset).balanceOf(address(this)) * shares) / totalShares;
        shareBalance[msg.sender] -= shares;
        totalShares -= shares;
        asset.safeTransfer(msg.sender, amountToReturn);
    }

    function takeFeeAsOwner(uint256 amount) public override onlyOwner {
        asset.safeTransfer(owner(), amount);
    }
} 

