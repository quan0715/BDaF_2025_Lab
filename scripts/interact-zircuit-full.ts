import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { Wallet } from "ethers";

// 加載環境變量
dotenv.config();

async function main() {
  // 獲取 provider
  const provider = new ethers.JsonRpcProvider(process.env.ZIRCUIT_RPC_URL);

  // 使用私鑰創建簽名者
  const ownerPrivateKey = process.env.PRIVATE_KEY || "";
  const alicePrivateKey = process.env.ALICE_PRIVATE_KEY || "";
  const bobPrivateKey = process.env.BOB_PRIVATE_KEY || "";

  if (!ownerPrivateKey || !alicePrivateKey || !bobPrivateKey) {
    throw new Error("請確保 .env 文件中設置了所有私鑰");
  }

  const owner = new Wallet(ownerPrivateKey, provider);
  const alice = new Wallet(alicePrivateKey, provider);
  const bob = new Wallet(bobPrivateKey, provider);

  console.log("擁有者地址:", owner.address);
  console.log("Alice 地址:", alice.address);
  console.log("Bob 地址:", bob.address);

  // 檢查餘額
  const ownerBalance = await provider.getBalance(owner.address);
  const aliceBalance = await provider.getBalance(alice.address);
  const bobBalance = await provider.getBalance(bob.address);

  console.log("擁有者餘額:", ethers.formatEther(ownerBalance), "ETH");
  console.log("Alice 餘額:", ethers.formatEther(aliceBalance), "ETH");
  console.log("Bob 餘額:", ethers.formatEther(bobBalance), "ETH");

  // 如果 Alice 或 Bob 餘額不足，從擁有者轉一些 ETH 給他們
  if (aliceBalance < ethers.parseEther("0.01")) {
    console.log("\n轉移 0.01 ETH 給 Alice...");
    const tx = await owner.sendTransaction({
      to: alice.address,
      value: ethers.parseEther("0.01"),
    });
    await tx.wait();
    console.log("轉移完成，交易哈希:", tx.hash);
  }

  if (bobBalance < ethers.parseEther("0.01")) {
    console.log("\n轉移 0.01 ETH 給 Bob...");
    const tx = await owner.sendTransaction({
      to: bob.address,
      value: ethers.parseEther("0.01"),
    });
    await tx.wait();
    console.log("轉移完成，交易哈希:", tx.hash);
  }

  // 替換為實際部署的合約地址
  const tokenAddress = "YOUR_TOKEN_ADDRESS";
  const lockAddress = "YOUR_LOCK_ADDRESS";

  // 獲取合約實例
  const myToken = new ethers.Contract(
    tokenAddress,
    [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address, uint256) returns (bool)",
    ],
    provider
  );

  const tokenLock = new ethers.Contract(
    lockAddress,
    [
      "function setStartTime(uint256) external",
      "function setEndTime(uint256) external",
      "function lock() external payable",
      "function unlock() external",
      "function tradeUserFunds(address) external",
      "function getETH(uint256) external",
      "function startTime() view returns (uint256)",
      "function endTime() view returns (uint256)",
      "function getUserLock(address) view returns (uint256, bool, bool, bool)",
      "function tradedETH() view returns (uint256)",
    ],
    provider
  );

  // 連接合約到各個簽名者
  const ownerToken = myToken.connect(owner);
  const ownerLock = tokenLock.connect(owner);
  const aliceLock = tokenLock.connect(alice);
  const bobLock = tokenLock.connect(bob);

  // 步驟 1: 設置鎖定時間
  console.log("\n步驟 1: 設置鎖定時間");
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = currentTime + 60; // 1分鐘後開始
  const endTime = currentTime + 300; // 5分鐘後結束

  console.log("設置開始時間...");
  let tx = await ownerLock.setStartTime(startTime);
  await tx.wait();
  console.log("開始時間設置完成，交易哈希:", tx.hash);

  console.log("設置結束時間...");
  tx = await ownerLock.setEndTime(endTime);
  await tx.wait();
  console.log("結束時間設置完成，交易哈希:", tx.hash);

  console.log("鎖定開始時間:", new Date(startTime * 1000).toLocaleString());
  console.log("鎖定結束時間:", new Date(endTime * 1000).toLocaleString());

  // 步驟 2: Alice 鎖定 ETH
  console.log("\n步驟 2: Alice 鎖定 ETH");
  console.log("等待開始時間前...");

  // 等待直到當前時間接近開始時間
  while (Math.floor(Date.now() / 1000) < startTime - 10) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 每 5 秒檢查一次
    console.log("當前時間:", new Date().toLocaleString());
    console.log(
      "距離開始時間還有:",
      startTime - Math.floor(Date.now() / 1000),
      "秒"
    );
  }

  console.log("Alice 鎖定 0.005 ETH...");
  tx = await aliceLock.lock({ value: ethers.parseEther("0.005") });
  await tx.wait();
  console.log("Alice 鎖定完成，交易哈希:", tx.hash);

  // 步驟 3: Bob 鎖定 ETH
  console.log("\n步驟 3: Bob 鎖定 ETH");
  console.log("Bob 鎖定 0.005 ETH...");
  tx = await bobLock.lock({ value: ethers.parseEther("0.005") });
  await tx.wait();
  console.log("Bob 鎖定完成，交易哈希:", tx.hash);

  // 步驟 4: 擁有者交易 Bob 的資金
  console.log("\n步驟 4: 擁有者交易 Bob 的資金");
  tx = await ownerLock.tradeUserFunds(bob.address);
  await tx.wait();
  console.log("交易 Bob 的資金完成，交易哈希:", tx.hash);

  // 檢查 Bob 的鎖定狀態
  const bobLockInfo = await tokenLock.getUserLock(bob.address);
  console.log("Bob 的鎖定狀態:");
  console.log("- 金額:", ethers.formatEther(bobLockInfo[0]), "ETH");
  console.log("- 是否鎖定:", bobLockInfo[1]);
  console.log("- 是否被交易:", bobLockInfo[2]);
  console.log("- 是否已獎勵:", bobLockInfo[3]);

  // 步驟 5: 等待鎖定期結束
  console.log("\n步驟 5: 等待鎖定期結束");
  console.log("當前時間:", new Date().toLocaleString());
  console.log("結束時間:", new Date(endTime * 1000).toLocaleString());
  console.log(
    "距離結束時間還有:",
    endTime - Math.floor(Date.now() / 1000),
    "秒"
  );

  // 等待直到當前時間超過結束時間
  while (Math.floor(Date.now() / 1000) < endTime + 10) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 每 10 秒檢查一次
    console.log("當前時間:", new Date().toLocaleString());
    console.log(
      "距離結束時間還有:",
      endTime - Math.floor(Date.now() / 1000),
      "秒"
    );
  }

  // 步驟 6: Alice 解鎖 ETH 並獲得小額獎勵
  console.log("\n步驟 6: Alice 解鎖 ETH 並獲得小額獎勵");

  // 解鎖前檢查 Alice 的餘額
  const aliceEthBefore = await provider.getBalance(alice.address);
  const aliceTokenBefore = await myToken.balanceOf(alice.address);

  console.log("解鎖前 Alice ETH 餘額:", ethers.formatEther(aliceEthBefore));
  console.log("解鎖前 Alice 代幣餘額:", ethers.formatEther(aliceTokenBefore));

  console.log("Alice 解鎖...");
  tx = await aliceLock.unlock();
  await tx.wait();
  console.log("Alice 解鎖完成，交易哈希:", tx.hash);

  // 解鎖後檢查 Alice 的餘額
  const aliceEthAfter = await provider.getBalance(alice.address);
  const aliceTokenAfter = await myToken.balanceOf(alice.address);

  console.log("解鎖後 Alice ETH 餘額:", ethers.formatEther(aliceEthAfter));
  console.log("解鎖後 Alice 代幣餘額:", ethers.formatEther(aliceTokenAfter));
  console.log(
    "Alice 獲得的代幣獎勵:",
    ethers.formatEther(aliceTokenAfter - aliceTokenBefore)
  );

  // 步驟 7: Bob 解鎖獲得大額獎勵（沒有 ETH）
  console.log("\n步驟 7: Bob 解鎖獲得大額獎勵");

  // 解鎖前檢查 Bob 的餘額
  const bobEthBefore = await provider.getBalance(bob.address);
  const bobTokenBefore = await myToken.balanceOf(bob.address);

  console.log("解鎖前 Bob ETH 餘額:", ethers.formatEther(bobEthBefore));
  console.log("解鎖前 Bob 代幣餘額:", ethers.formatEther(bobTokenBefore));

  console.log("Bob 解鎖...");
  tx = await bobLock.unlock();
  await tx.wait();
  console.log("Bob 解鎖完成，交易哈希:", tx.hash);

  // 解鎖後檢查 Bob 的餘額
  const bobEthAfter = await provider.getBalance(bob.address);
  const bobTokenAfter = await myToken.balanceOf(bob.address);

  console.log("解鎖後 Bob ETH 餘額:", ethers.formatEther(bobEthAfter));
  console.log("解鎖後 Bob 代幣餘額:", ethers.formatEther(bobTokenAfter));
  console.log(
    "Bob 獲得的代幣獎勵:",
    ethers.formatEther(bobTokenAfter - bobTokenBefore)
  );

  // 步驟 8: 擁有者提取交易的 ETH
  console.log("\n步驟 8: 擁有者提取交易的 ETH");

  // 檢查已交易的 ETH 數量
  const tradedETH = await tokenLock.tradedETH();
  console.log("已交易的 ETH 數量:", ethers.formatEther(tradedETH));

  // 提取前檢查擁有者餘額
  const ownerEthBefore = await provider.getBalance(owner.address);
  console.log("提取前擁有者 ETH 餘額:", ethers.formatEther(ownerEthBefore));

  console.log("擁有者提取交易的 ETH...");
  tx = await ownerLock.getETH(tradedETH);
  await tx.wait();
  console.log("提取完成，交易哈希:", tx.hash);

  // 提取後檢查擁有者餘額
  const ownerEthAfter = await provider.getBalance(owner.address);
  console.log("提取後擁有者 ETH 餘額:", ethers.formatEther(ownerEthAfter));
  console.log(
    "擁有者獲得的 ETH:",
    ethers.formatEther(ownerEthAfter - ownerEthBefore)
  );

  // 總結
  console.log("\n===== 交易摘要 =====");
  console.log("1. Alice 鎖定 ETH 交易哈希:", tx.hash);
  console.log("2. Alice 解鎖 ETH 交易哈希:", tx.hash);
  console.log("3. Bob 鎖定 ETH 交易哈希:", tx.hash);
  console.log("4. 擁有者交易 Bob 的 ETH 交易哈希:", tx.hash);
  console.log("5. Bob 解鎖獲得獎勵交易哈希:", tx.hash);
}

main().catch((error) => {
  console.error("錯誤:", error);
  process.exitCode = 1;
});
