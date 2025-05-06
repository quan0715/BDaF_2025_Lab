import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vault 基本功能與安全性測試", function () {
  let vault: any;
  let token: any;
  let owner: any;
  let alice: any;
  let bob: any;
  let malice: any;

  beforeEach(async function () {
    [owner, alice, bob, malice] = await ethers.getSigners();
    // 部署測試用 ERC20 代幣
    const Token = await ethers.getContractFactory("QuanToken");
    token = await Token.deploy();
    await token.waitForDeployment();
    // 部署 Vault 合約
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(await token.getAddress());
    await vault.waitForDeployment();
    // owner 給 alice, bob, malice 一些 token
    await token.transfer(alice.address, ethers.parseEther("1000"));
    await token.transfer(bob.address, ethers.parseEther("1000"));
    await token.transfer(malice.address, ethers.parseEther("1000"));
  });

  it("應正確初始化 underlyingToken 與 owner", async function () {
    expect(await vault.asset()).to.equal(await token.getAddress());
    expect(await vault.owner()).to.equal(owner.address);
  });

  it("存款後應發行 shares 並更新 sharePrice", async function () {
    await token.connect(alice).approve(vault, ethers.parseEther("100"));
    await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);
    expect(await vault.balanceOf(alice.address)).to.equal(
      ethers.parseEther("100")
    );
    expect(await vault.sharePrice()).to.equal(ethers.parseEther("1"));
  });

  it("提領 shares 應返還正確的 underlying token 並銷毀 shares", async function () {
    await token.connect(alice).approve(vault, ethers.parseEther("100"));
    await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);
    await vault
      .connect(alice)
      .withdraw(ethers.parseEther("100"), alice.address, alice.address);
    expect(await vault.balanceOf(alice.address)).to.equal(0);
    expect(await token.balanceOf(alice.address)).to.be.closeTo(
      ethers.parseEther("1000"),
      ethers.parseEther("0.0001")
    );
  });

  it("owner 可提領費用 (takeFeeAsOwner)", async function () {
    await token.connect(alice).approve(vault, ethers.parseEther("100"));
    await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);
    const before = await token.balanceOf(owner.address);
    await vault.connect(owner).takeFeeAsOwner(ethers.parseEther("10"));
    const after = await token.balanceOf(owner.address);
    expect(after - before).to.equal(ethers.parseEther("10"));
  });

  it("shares 與 sharePrice 應隨 vault 資產變化正確調整", async function () {
    await token.connect(alice).approve(vault, ethers.parseEther("100"));
    await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);
    await token.connect(bob).approve(vault, ethers.parseEther("100"));
    await vault.connect(bob).deposit(ethers.parseEther("100"), bob.address);
    // 直接捐贈 100 token
    await token
      .connect(owner)
      .transfer(await vault.getAddress(), ethers.parseEther("100"));
    // sharePrice = 300/200 = 1.5
    expect(await vault.sharePrice()).to.equal(ethers.parseEther("1.5"));
  });

  it("應能重現 inflation attack", async function () {
    // malice 先存 1 wei
    await token.connect(malice).approve(vault, 1);
    await vault.connect(malice).deposit(1, malice.address);
    // malice 直接捐贈 1000 ether
    await token
      .connect(malice)
      .transfer(await vault.getAddress(), ethers.parseEther("1000"));
    // bob 存 100 ether
    await token.connect(bob).approve(vault, ethers.parseEther("100"));
    await vault.connect(bob).deposit(ethers.parseEther("100"), bob.address);
    // bob 幾乎拿不到 shares
    expect(await vault.balanceOf(bob.address)).to.equal(0);
    // malice 提領全部 shares
    await vault
      .connect(malice)
      .redeem(
        await vault.balanceOf(malice.address),
        malice.address,
        malice.address
      );
    // malice 拿走大部分資產
    expect(await token.balanceOf(malice.address)).to.be.gt(
      ethers.parseEther("1000")
    );
    // bob 幾乎損失全部
    expect(await token.balanceOf(bob.address)).to.be.lt(
      ethers.parseEther("1000")
    );
  });

  it("takeFeeAsOwner 具高風險，owner 可 rug pull", async function () {
    await token.connect(alice).approve(vault, ethers.parseEther("100"));
    await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);
    const before = await token.balanceOf(owner.address);
    // owner rug pull
    await vault.connect(owner).takeFeeAsOwner(ethers.parseEther("100"));
    const after = await token.balanceOf(owner.address);
    expect(after - before).to.equal(ethers.parseEther("100"));
    // vault 內資產歸零
    expect(await vault.totalAssets()).to.equal(0);
  });
});
