import { expect } from "chai";
import { ethers } from "hardhat";
import { FixedRateSwap, TestTokenA, TestTokenB } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FixedRateSwap", function () {
  let fixedRateSwap: FixedRateSwap;
  let tokenA: TestTokenA;
  let tokenB: TestTokenB;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1,000,000 tokens
  const LIQUIDITY_A = ethers.parseEther("10000"); // 10,000 TokenA
  const LIQUIDITY_B = ethers.parseEther("30000"); // 30,000 TokenB (3:1 ratio)

  beforeEach(async function () {
    // 獲取簽名者
    [owner, user1, user2] = await ethers.getSigners();

    // 部署代幣合約
    const TestTokenAFactory = await ethers.getContractFactory("TestTokenA");
    tokenA = await TestTokenAFactory.deploy();

    const TestTokenBFactory = await ethers.getContractFactory("TestTokenB");
    tokenB = await TestTokenBFactory.deploy();

    // 部署 swap 合約
    const FixedRateSwapFactory = await ethers.getContractFactory(
      "FixedRateSwap"
    );
    fixedRateSwap = await FixedRateSwapFactory.deploy(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );

    // 為用戶鑄造代幣
    await tokenA.mintForTest(user1.address, ethers.parseEther("1000"));
    await tokenB.mintForTest(user1.address, ethers.parseEther("3000"));
    await tokenA.mintForTest(user2.address, ethers.parseEther("500"));
    await tokenB.mintForTest(user2.address, ethers.parseEther("1500"));

    // 為 swap 合約添加流動性
    await tokenA.approve(await fixedRateSwap.getAddress(), LIQUIDITY_A);
    await tokenB.approve(await fixedRateSwap.getAddress(), LIQUIDITY_B);
    await fixedRateSwap.addLiquidity(LIQUIDITY_A, LIQUIDITY_B);
  });

  describe("部署測試", function () {
    it("應該正確設置代幣地址", async function () {
      expect(await fixedRateSwap.tokenA()).to.equal(await tokenA.getAddress());
      expect(await fixedRateSwap.tokenB()).to.equal(await tokenB.getAddress());
    });

    it("應該正確設置兌換比例", async function () {
      expect(await fixedRateSwap.RATE_A_TO_B()).to.equal(3);
      expect(await fixedRateSwap.RATE_B_TO_A()).to.equal(1);
    });

    it("應該正確設置合約擁有者", async function () {
      expect(await fixedRateSwap.owner()).to.equal(owner.address);
    });
  });

  describe("流動性管理", function () {
    it("應該允許擁有者添加流動性", async function () {
      const additionalA = ethers.parseEther("100");
      const additionalB = ethers.parseEther("300");

      await tokenA.approve(await fixedRateSwap.getAddress(), additionalA);
      await tokenB.approve(await fixedRateSwap.getAddress(), additionalB);

      await expect(fixedRateSwap.addLiquidity(additionalA, additionalB))
        .to.emit(fixedRateSwap, "LiquidityAdded")
        .withArgs(owner.address, additionalA, additionalB);

      const [reserveA, reserveB] = await fixedRateSwap.getReserves();
      expect(reserveA).to.equal(LIQUIDITY_A + additionalA);
      expect(reserveB).to.equal(LIQUIDITY_B + additionalB);
    });

    it("應該拒絕非擁有者添加流動性", async function () {
      const additionalA = ethers.parseEther("100");
      const additionalB = ethers.parseEther("300");

      await tokenA
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), additionalA);
      await tokenB
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), additionalB);

      await expect(
        fixedRateSwap.connect(user1).addLiquidity(additionalA, additionalB)
      ).to.be.revertedWithCustomError(
        fixedRateSwap,
        "OwnableUnauthorizedAccount"
      );
    });

    it("應該允許擁有者移除流動性", async function () {
      const removeA = ethers.parseEther("1000");
      const removeB = ethers.parseEther("3000");

      await expect(fixedRateSwap.removeLiquidity(removeA, removeB))
        .to.emit(fixedRateSwap, "LiquidityRemoved")
        .withArgs(owner.address, removeA, removeB);

      const [reserveA, reserveB] = await fixedRateSwap.getReserves();
      expect(reserveA).to.equal(LIQUIDITY_A - removeA);
      expect(reserveB).to.equal(LIQUIDITY_B - removeB);
    });
  });

  describe("TokenA 兌換 TokenB", function () {
    it("應該成功執行 A 到 B 的兌換", async function () {
      const amountA = ethers.parseEther("100");
      const expectedAmountB = amountA * 3n; // 1:3 比例

      // 用戶授權
      await tokenA
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), amountA);

      const initialBalanceA = await tokenA.balanceOf(user1.address);
      const initialBalanceB = await tokenB.balanceOf(user1.address);

      await expect(fixedRateSwap.connect(user1).swapAToB(amountA))
        .to.emit(fixedRateSwap, "SwapAToB")
        .withArgs(user1.address, amountA, expectedAmountB);

      // 檢查餘額變化
      expect(await tokenA.balanceOf(user1.address)).to.equal(
        initialBalanceA - amountA
      );
      expect(await tokenB.balanceOf(user1.address)).to.equal(
        initialBalanceB + expectedAmountB
      );
    });

    it("應該拒絕零數量兌換", async function () {
      await expect(fixedRateSwap.connect(user1).swapAToB(0)).to.be.revertedWith(
        "兌換數量必須大於 0"
      );
    });

    it("應該在合約 TokenB 餘額不足時失敗", async function () {
      const largeAmount = ethers.parseEther("20000"); // 需要 60,000 TokenB，但合約只有 30,000

      await tokenA.connect(user1).mintForTest(user1.address, largeAmount);
      await tokenA
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), largeAmount);

      await expect(
        fixedRateSwap.connect(user1).swapAToB(largeAmount)
      ).to.be.revertedWith("合約 TokenB 餘額不足");
    });
  });

  describe("TokenB 兌換 TokenA", function () {
    it("應該成功執行 B 到 A 的兌換", async function () {
      const amountB = ethers.parseEther("300"); // 必須是 3 的倍數
      const expectedAmountA = amountB / 3n; // 3:1 比例

      // 用戶授權
      await tokenB
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), amountB);

      const initialBalanceA = await tokenA.balanceOf(user1.address);
      const initialBalanceB = await tokenB.balanceOf(user1.address);

      await expect(fixedRateSwap.connect(user1).swapBToA(amountB))
        .to.emit(fixedRateSwap, "SwapBToA")
        .withArgs(user1.address, amountB, expectedAmountA);

      // 檢查餘額變化
      expect(await tokenA.balanceOf(user1.address)).to.equal(
        initialBalanceA + expectedAmountA
      );
      expect(await tokenB.balanceOf(user1.address)).to.equal(
        initialBalanceB - amountB
      );
    });

    it("應該拒絕不是 3 的倍數的 TokenB 數量", async function () {
      const invalidAmount = ethers.parseEther("100"); // 不是 3 的倍數

      await tokenB
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), invalidAmount);

      await expect(
        fixedRateSwap.connect(user1).swapBToA(invalidAmount)
      ).to.be.revertedWith("TokenB 數量必須是 3 的倍數");
    });

    it("應該在合約 TokenA 餘額不足時失敗", async function () {
      const largeAmount = ethers.parseEther("60000"); // 需要 20,000 TokenA，但合約只有 10,000

      await tokenB.connect(user1).mintForTest(user1.address, largeAmount);
      await tokenB
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), largeAmount);

      await expect(
        fixedRateSwap.connect(user1).swapBToA(largeAmount)
      ).to.be.revertedWith("合約 TokenA 餘額不足");
    });
  });

  describe("價格計算", function () {
    it("應該正確計算 A 到 B 的兌換數量", async function () {
      const amountA = ethers.parseEther("100");
      const expectedAmountB = amountA * 3n;

      const result = await fixedRateSwap.getAmountOut(
        amountA,
        await tokenA.getAddress()
      );
      expect(result).to.equal(expectedAmountB);
    });

    it("應該正確計算 B 到 A 的兌換數量", async function () {
      const amountB = ethers.parseEther("300");
      const expectedAmountA = amountB / 3n;

      const result = await fixedRateSwap.getAmountOut(
        amountB,
        await tokenB.getAddress()
      );
      expect(result).to.equal(expectedAmountA);
    });

    it("應該拒絕無效的代幣地址", async function () {
      const amount = ethers.parseEther("100");
      const invalidToken = ethers.ZeroAddress;

      await expect(
        fixedRateSwap.getAmountOut(amount, invalidToken)
      ).to.be.revertedWith("無效的代幣地址");
    });
  });

  describe("儲備查詢", function () {
    it("應該返回正確的儲備量", async function () {
      const [reserveA, reserveB] = await fixedRateSwap.getReserves();
      expect(reserveA).to.equal(LIQUIDITY_A);
      expect(reserveB).to.equal(LIQUIDITY_B);
    });
  });

  describe("完整交易流程", function () {
    it("應該支持連續的雙向兌換", async function () {
      // 第一步：A 兌換 B
      const amountA = ethers.parseEther("100");
      await tokenA
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), amountA);
      await fixedRateSwap.connect(user1).swapAToB(amountA);

      // 第二步：B 兌換 A
      const amountB = ethers.parseEther("150"); // 3 的倍數
      await tokenB
        .connect(user1)
        .approve(await fixedRateSwap.getAddress(), amountB);
      await fixedRateSwap.connect(user1).swapBToA(amountB);

      // 驗證最終狀態
      const [finalReserveA, finalReserveB] = await fixedRateSwap.getReserves();
      expect(finalReserveA).to.equal(LIQUIDITY_A + amountA - amountB / 3n);
      expect(finalReserveB).to.equal(LIQUIDITY_B - amountA * 3n + amountB);
    });
  });
});
