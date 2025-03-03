import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Contract", function () {
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let contract: Contract;

  beforeEach(async function () {
    // 取得測試用的帳戶
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    // 取得合約工廠，部署合約
    const ContractFactory = await ethers.getContractFactory("Contract");
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    // 檢查 owner 是否正確設定
    let ownerAddress = await owner.getAddress();
    let ownerGetFromContract = await contract.getOwner();
    expect(ownerGetFromContract).to.equal(ownerAddress);
  });

  it("Should receive ETH and emit Received event", async function () {
    // 由 owner 發送 1 ETH 到合約，並驗證 Received 事件
    expect(
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: ethers.parseEther("1.0"),
      })
    )
      .to.emit(contract, "Received")
      .withArgs(await owner.getAddress(), ethers.parseEther("1.0"));
  });

  it("Should return the correct balance", async function () {
    // 發送 1 ETH 到合約
    await owner.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    // 驗證合約餘額正確
    expect(await contract.getBalance()).to.equal(ethers.parseEther("1.0"));
  });

  it("Should allow the owner to withdraw funds", async function () {
    // 使用 addr1 向合約轉入 1 ETH
    await addr1.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    // 取得 owner 的初始餘額
    let ownerAddress = await owner.getAddress();
    const initialOwnerBalance = await ethers.provider.getBalance(ownerAddress);

    // 由 owner 呼叫 withdraw 提款
    const tx = await contract.withdraw();
    const receipt = await tx.wait();

    // 計算交易所花費的 gas 費用
    const gasUsed = receipt.gasUsed;
    const txDetails = await ethers.provider.getTransaction(tx.hash);
    const gasPrice = txDetails?.gasPrice;
    const gasCost = gasUsed * (gasPrice ?? 0n);

    // 驗證 owner 餘額增加存入金額（扣除 gas 費）
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    expect(finalOwnerBalance).to.be.closeTo(
      initialOwnerBalance + ethers.parseEther("1.0") - gasCost,
      ethers.parseEther("0.001") // 允許誤差 0.001 ETH
    );
  });

  it("Should not allow non-owner to withdraw funds", async function () {
    // 使用 addr1 向合約轉入 1 ETH
    await addr1.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    // 驗證非 owner 呼叫 withdraw 時會 revert 並顯示錯誤訊息
    await expect(contract.connect(addr1).withdraw()).to.be.revertedWith(
      "Only owner can withdraw"
    );
  });
});
