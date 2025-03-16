import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";

describe("TokenLock", function () {
  // 聲明變量
  let myToken: any;
  let tokenLock: any;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;
  let tokenAddress: string;
  let lockAddress: string;

  // 在每個測試前部署合約
  beforeEach(async function () {
    // 獲取測試賬戶
    [owner, alice, bob, charlie] = await ethers.getSigners();

    // 部署 MyToken 合約
    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy();
    await myToken.waitForDeployment();
    tokenAddress = await myToken.getAddress();

    // 部署 TokenLock 合約
    const TokenLock = await ethers.getContractFactory("TokenLock");
    tokenLock = await TokenLock.deploy(tokenAddress);
    await tokenLock.waitForDeployment();
    lockAddress = await tokenLock.getAddress();

    // 轉移代幣到 TokenLock 合約作為獎勵池
    await myToken.transfer(lockAddress, ethers.parseEther("1000000"));
  });

  // 測試合約部署
  describe("部署", function () {
    it("應該正確設置擁有者", async function () {
      expect(await tokenLock.owner()).to.equal(owner.address);
    });

    it("應該正確設置獎勵代幣地址", async function () {
      expect(await tokenLock.rewardToken()).to.equal(tokenAddress);
    });

    it("應該有足夠的獎勵代幣餘額", async function () {
      expect(await myToken.balanceOf(lockAddress)).to.equal(
        ethers.parseEther("1000000")
      );
    });
  });

  // 測試時間設置功能
  describe("時間設置", function () {
    it("只有擁有者可以設置開始時間", async function () {
      const futureTime = (await time.latest()) + 100;
      await expect(
        tokenLock.connect(alice).setStartTime(futureTime)
      ).to.be.revertedWithCustomError(tokenLock, "OwnableUnauthorizedAccount");
    });

    it("只有擁有者可以設置結束時間", async function () {
      const futureTime = (await time.latest()) + 200;
      await expect(
        tokenLock.connect(alice).setEndTime(futureTime)
      ).to.be.revertedWithCustomError(tokenLock, "OwnableUnauthorizedAccount");
    });

    it("開始時間必須在未來", async function () {
      const pastTime = (await time.latest()) - 100;
      await expect(tokenLock.setStartTime(pastTime)).to.be.revertedWith(
        "Start time must be in the future"
      );
    });

    it("結束時間必須在開始時間之後", async function () {
      const futureTime = (await time.latest()) + 100;
      await tokenLock.setStartTime(futureTime);

      await expect(tokenLock.setEndTime(futureTime - 50)).to.be.revertedWith(
        "End time must be after start time"
      );
    });

    it("應該正確設置開始和結束時間", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      expect(await tokenLock.startTime()).to.equal(startTime);
      expect(await tokenLock.endTime()).to.equal(endTime);
    });
  });

  // 測試鎖定功能
  describe("鎖定 ETH", function () {
    it("在時間設置前不能鎖定 ETH", async function () {
      await expect(
        tokenLock.connect(alice).lock({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Time not set by owner");
    });

    it("必須鎖定大於 0 的 ETH", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      await expect(
        tokenLock.connect(alice).lock({ value: 0 })
      ).to.be.revertedWith("Must lock some ETH");
    });

    it("只能在開始時間之前鎖定 ETH", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之後
      await time.setNextBlockTimestamp(startTime + 10);
      await ethers.provider.send("evm_mine", []);

      await expect(
        tokenLock.connect(alice).lock({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Lock period has ended");
    });

    it("用戶不能重複鎖定 ETH", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // 第一次鎖定
      await tokenLock.connect(alice).lock({ value: ethers.parseEther("1") });

      // 第二次鎖定應該失敗
      await expect(
        tokenLock.connect(alice).lock({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Already locked ETH");
    });

    it("應該正確記錄用戶鎖定的 ETH", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // 鎖定 ETH
      await tokenLock.connect(alice).lock({ value: ethers.parseEther("1") });

      // 檢查鎖定記錄
      const userLock = await tokenLock.getUserLock(alice.address);
      expect(userLock[0]).to.equal(ethers.parseEther("1")); // amount
      expect(userLock[1]).to.be.true; // isLocked
      expect(userLock[2]).to.be.false; // isTaken
      expect(userLock[3]).to.be.false; // isRewarded
    });

    it("應該發出 Lock 事件", async function () {
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // 鎖定 ETH 並檢查事件
      await expect(
        tokenLock.connect(alice).lock({ value: ethers.parseEther("1") })
      )
        .to.emit(tokenLock, "Lock")
        .withArgs(alice.address, ethers.parseEther("1"));
    });
  });

  // 測試解鎖功能
  describe("解鎖 ETH", function () {
    beforeEach(async function () {
      // 設置時間並鎖定 ETH
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // Alice 和 Bob 鎖定 ETH
      await tokenLock.connect(alice).lock({ value: ethers.parseEther("1") });
      await tokenLock.connect(bob).lock({ value: ethers.parseEther("2") });
    });

    it("在結束時間之前不能解鎖", async function () {
      await expect(tokenLock.connect(alice).unlock()).to.be.revertedWith(
        "Lock period not over"
      );
    });

    it("未鎖定 ETH 的用戶不能解鎖", async function () {
      // 調整時間到結束時間之後
      const endTime = await tokenLock.endTime();
      await time.setNextBlockTimestamp(Number(endTime) + 10);
      await ethers.provider.send("evm_mine", []);

      await expect(tokenLock.connect(charlie).unlock()).to.be.revertedWith(
        "No ETH locked"
      );
    });

    it("用戶解鎖後應該收回 ETH 並獲得獎勵", async function () {
      // 調整時間到結束時間之後
      const endTime = await tokenLock.endTime();
      await time.setNextBlockTimestamp(Number(endTime) + 10);
      await ethers.provider.send("evm_mine", []);

      // 解鎖前的餘額
      const aliceEthBefore = await ethers.provider.getBalance(alice.address);
      // Alice 解鎖
      const unlockTx = await tokenLock.connect(alice).unlock();
      const receipt = await unlockTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      // 解鎖後的餘額
      const aliceEthAfter = await ethers.provider.getBalance(alice.address);
      const aliceTokenBalance = await myToken.balanceOf(alice.address);

      // 檢查 ETH 餘額變化（考慮 gas 費用）
      expect(aliceEthAfter + BigInt(gasUsed) - aliceEthBefore).to.equal(
        ethers.parseEther("1")
      );
      // 檢查獎勵代幣 (固定 1000 代幣)
      expect(aliceTokenBalance).to.equal(ethers.parseEther("1000"));

      // 檢查用戶鎖定狀態
      const userLock = await tokenLock.getUserLock(alice.address);
      expect(userLock[3]).to.be.true; // isRewarded
    });

    it("用戶不能重複解鎖", async function () {
      // 調整時間到結束時間之後
      const endTime = await tokenLock.endTime();
      await time.setNextBlockTimestamp(Number(endTime) + 10);
      await ethers.provider.send("evm_mine", []);

      // 第一次解鎖
      await tokenLock.connect(alice).unlock();

      // 第二次解鎖應該失敗
      await expect(tokenLock.connect(alice).unlock()).to.be.revertedWith(
        "Already rewarded"
      );
    });

    it("應該發出 Unlock 事件", async function () {
      // 調整時間到結束時間之後
      const endTime = await tokenLock.endTime();
      await time.setNextBlockTimestamp(Number(endTime) + 10);
      await ethers.provider.send("evm_mine", []);

      // 解鎖並檢查事件
      await expect(tokenLock.connect(alice).unlock())
        .to.emit(tokenLock, "Unlock")
        .withArgs(
          alice.address,
          ethers.parseEther("1"),
          ethers.parseEther("1000")
        );
    });
  });

  // 測試資金交易功能
  describe("交易用戶資金", function () {
    beforeEach(async function () {
      // 設置時間並鎖定 ETH
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // Alice 和 Bob 鎖定 ETH
      await tokenLock.connect(alice).lock({ value: ethers.parseEther("1") });
      await tokenLock.connect(bob).lock({ value: ethers.parseEther("2") });
    });

    it("只有擁有者可以交易用戶資金", async function () {
      await expect(
        tokenLock.connect(alice).tradeUserFunds(bob.address)
      ).to.be.revertedWithCustomError(tokenLock, "OwnableUnauthorizedAccount");
    });

    it("不能交易未鎖定 ETH 的用戶資金", async function () {
      await expect(
        tokenLock.tradeUserFunds(charlie.address)
      ).to.be.revertedWith("No ETH locked for this user");
    });

    it("不能重複交易同一用戶的資金", async function () {
      // 第一次交易
      await tokenLock.tradeUserFunds(alice.address);

      // 第二次交易應該失敗
      await expect(tokenLock.tradeUserFunds(alice.address)).to.be.revertedWith(
        "ETH already taken"
      );
    });

    it("應該正確記錄交易的 ETH", async function () {
      // 交易 Bob 的資金
      await tokenLock.tradeUserFunds(bob.address);

      // 檢查 Bob 的鎖定狀態
      const bobLock = await tokenLock.getUserLock(bob.address);
      expect(bobLock[2]).to.be.true; // isTaken

      // 檢查已交易的 ETH 總量
      expect(await tokenLock.tradeETHAmount()).to.equal(ethers.parseEther("2"));
    });

    it("應該發出 FundsTraded 事件", async function () {
      // 交易並檢查事件
      await expect(tokenLock.tradeUserFunds(bob.address))
        .to.emit(tokenLock, "FundsTraded")
        .withArgs(bob.address, ethers.parseEther("2"));
    });
  });

  // 測試 ETH 提取功能
  describe("提取交易的 ETH", function () {
    beforeEach(async function () {
      // 設置時間並鎖定 ETH
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // Alice 和 Bob 鎖定 ETH
      await tokenLock.connect(alice).lock({ value: ethers.parseEther("1") });
      await tokenLock.connect(bob).lock({ value: ethers.parseEther("2") });

      // 交易 Bob 的資金
      await tokenLock.tradeUserFunds(bob.address);
    });

    it("只有擁有者可以提取 ETH", async function () {
      await expect(
        tokenLock.connect(alice).getETH(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(tokenLock, "OwnableUnauthorizedAccount");
    });

    it("不能提取超過已交易的 ETH", async function () {
      await expect(tokenLock.getETH(ethers.parseEther("3"))).to.be.revertedWith(
        "Insufficient trade ETH amount"
      );
    });

    it("應該正確提取 ETH 並更新已交易總量", async function () {
      // 提取前的餘額
      const ownerEthBefore = await ethers.provider.getBalance(owner.address);

      // 提取 ETH
      const withdrawTx = await tokenLock.getETH(ethers.parseEther("1"));
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // 提取後的餘額
      const ownerEthAfter = await ethers.provider.getBalance(owner.address);

      // 檢查 ETH 餘額變化（考慮 gas 費用）
      expect(ownerEthAfter + BigInt(gasUsed) - ownerEthBefore).to.equal(
        ethers.parseEther("1")
      );

      // 檢查已交易的 ETH 總量
      expect(await tokenLock.tradeETHAmount()).to.equal(ethers.parseEther("1"));
    });
  });

  // 測試資金被交易後的解鎖
  describe("資金被交易後的解鎖", function () {
    beforeEach(async function () {
      // 設置時間並鎖定 ETH
      const startTime = (await time.latest()) + 100;
      const endTime = startTime + 300;

      await tokenLock.setStartTime(startTime);
      await tokenLock.setEndTime(endTime);

      // 調整時間到開始時間之前
      await time.setNextBlockTimestamp(startTime - 10);

      // Bob 鎖定 ETH
      await tokenLock.connect(bob).lock({ value: ethers.parseEther("2") });

      // 交易 Bob 的資金
      await tokenLock.tradeUserFunds(bob.address);

      // 調整時間到結束時間之後
      await time.setNextBlockTimestamp(Number(endTime) + 10);
      await ethers.provider.send("evm_mine", []);
    });

    it("資金被交易的用戶解鎖時不應該收到 ETH", async function () {
      // 解鎖前的餘額
      const bobEthBefore = await ethers.provider.getBalance(bob.address);

      // Bob 解鎖
      const unlockTx = await tokenLock.connect(bob).unlock();
      const receipt = await unlockTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // 解鎖後的餘額
      const bobEthAfter = await ethers.provider.getBalance(bob.address);

      // 檢查 ETH 餘額變化（應該只減少 gas 費用）
      expect(bobEthBefore - bobEthAfter).to.equal(gasUsed);
    });

    it("資金被交易的用戶應該獲得更多獎勵", async function () {
      // Bob 解鎖
      await tokenLock.connect(bob).unlock();

      // 檢查獎勵代幣
      const bobTokenBalance = await myToken.balanceOf(bob.address);

      // 獎勵應該是 1000 + (2 ETH * 2500)
      const expectedReward =
        ethers.parseEther("1000") + ethers.parseEther("2") * BigInt(2500);

      expect(bobTokenBalance).to.equal(expectedReward);
    });
  });
});
