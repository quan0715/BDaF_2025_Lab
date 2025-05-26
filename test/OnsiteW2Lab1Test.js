const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OnsiteW2Lab1Flags 重入攻擊測試", function () {
  let owner, attacker;
  let flagContract, attackerContract;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();

    // 部署目標合約
    const FlagContract = await ethers.getContractFactory("OnsiteW2Lab1Flags");
    flagContract = await FlagContract.connect(owner).deploy();

    // 部署攻擊合約
    const AttackerContract = await ethers.getContractFactory(
      "ReentrancyAttacker"
    );
    attackerContract = await AttackerContract.connect(attacker).deploy(
      flagContract.address
    );
  });

  it("應該通過重入攻擊獲得flag", async function () {
    // 檢查攻擊前的狀態
    const initialPassed = await flagContract.passed(attacker.address);
    expect(initialPassed).to.equal(false);

    // 執行攻擊
    const attackValue = ethers.parseEther("0.1");
    await attackerContract.connect(attacker).attack({ value: attackValue });

    // 檢查攻擊後的狀態
    const finalPassed = await flagContract.passed(attacker.address);
    expect(finalPassed).to.equal(true);
  });
});
