import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken", function () {
  let myToken: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // 獲取測試賬戶
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署 MyToken 合約
    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy();
    await myToken.waitForDeployment();
  });

  // 測試基本資訊
  it("應該有正確的名稱、符號和小數位數", async function () {
    expect(await myToken.name()).to.equal("MyToken");
    expect(await myToken.symbol()).to.equal("MTK");
    expect(await myToken.decimals()).to.equal(18);
  });

  // 測試總供應量
  it("應該鑄造正確的總供應量", async function () {
    const expectedSupply = ethers.parseEther("100000000"); // 100,000,000 代幣，18 位小數
    expect(await myToken.totalSupply()).to.equal(expectedSupply);
  });

  // 測試初始餘額
  it("應該將所有代幣分配給部署者", async function () {
    const totalSupply = await myToken.totalSupply();
    expect(await myToken.balanceOf(owner.address)).to.equal(totalSupply);
  });

  // 測試轉賬功能
  it("應該允許轉賬代幣", async function () {
    // 轉賬 1000 代幣給 addr1
    const transferAmount = ethers.parseEther("1000");
    await myToken.transfer(addr1.address, transferAmount);

    // 檢查餘額
    expect(await myToken.balanceOf(addr1.address)).to.equal(transferAmount);

    // addr1 轉賬 500 代幣給 addr2
    await myToken
      .connect(addr1)
      .transfer(addr2.address, ethers.parseEther("500"));

    // 檢查兩者餘額
    expect(await myToken.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("500")
    );
    expect(await myToken.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("500")
    );
  });

  // 測試授權與代理轉賬
  it("應該允許授權和代理轉賬", async function () {
    // owner 授權 addr1 可以使用 2000 代幣
    const approveAmount = ethers.parseEther("2000");
    await myToken.approve(addr1.address, approveAmount);

    // 檢查授權金額
    expect(await myToken.allowance(owner.address, addr1.address)).to.equal(
      approveAmount
    );

    // addr1 從 owner 代理轉賬 1000 代幣給 addr2
    await myToken
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, ethers.parseEther("1000"));

    // 檢查餘額和授權餘額
    expect(await myToken.balanceOf(addr2.address)).to.equal(
      ethers.parseEther("1000")
    );
    expect(await myToken.allowance(owner.address, addr1.address)).to.equal(
      ethers.parseEther("1000")
    );
  });

  // 測試轉賬失敗情況
  it("轉賬應該在餘額不足時失敗", async function () {
    // addr1 初始沒有代幣
    await expect(
      myToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
    ).to.be.reverted;
  });
});
