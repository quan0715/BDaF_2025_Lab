import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("合約擁有者:", owner.address);

  // 替換為實際部署的地址
  const tokenAddress = "0x58197663442cad0fcA87A19Cf5d11685c51e8862";
  const lockAddress = "0x3A9ccf6E6e92F8BfCE3763aC2fAB82Fd8fafdB73";

  // 獲取合約實例
  const myToken = await ethers.getContractAt("MyToken", tokenAddress);
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);

  // 設置鎖定時間
  console.log("\n設置鎖定時間...");
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = currentTime + 60; // 1分鐘後開始
  const endTime = startTime + 120; // 2分鐘後結束

  await tokenLock.setStartTime(startTime);
  await tokenLock.setEndTime(endTime);

  console.log(
    "鎖定開始時間:",
    new Date(Number(await tokenLock.startTime()) * 1000).toLocaleString()
  );
  console.log(
    "鎖定結束時間:",
    new Date(Number(await tokenLock.endTime()) * 1000).toLocaleString()
  );
}

async function Lock() {
  const [owner] = await ethers.getSigners();
  console.log("合約擁有者:", owner.address);

  const tokenAddress = "0x58197663442cad0fcA87A19Cf5d11685c51e8862";
  const lockAddress = "0x3A9ccf6E6e92F8BfCE3763aC2fAB82Fd8fafdB73";

  const token = await ethers.getContractAt("MyToken", tokenAddress);
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);

  // check account balance
  console.log("餘額:", await ethers.provider.getBalance(owner.address));

  const tx = await tokenLock.connect(owner).lock({
    value: ethers.parseEther("0.0000000000000001"),
  });

  const receipt = await tx.wait();
  console.log("交易結果:", receipt);

  console.log("Lock 後餘額:", await ethers.provider.getBalance(owner.address));
}

async function unlock() {
  const [owner] = await ethers.getSigners();
  console.log("合約擁有者:", owner.address);

  const tokenAddress = "0x58197663442cad0fcA87A19Cf5d11685c51e8862";
  const lockAddress = "0x3A9ccf6E6e92F8BfCE3763aC2fAB82Fd8fafdB73";

  const token = await ethers.getContractAt("MyToken", tokenAddress);
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);

  const tx = await tokenLock.connect(owner).unlock();
  const receipt = await tx.wait();
  console.log("交易結果:", receipt);

  console.log(
    "Unlock 後餘額:",
    await ethers.provider.getBalance(owner.address)
  );

  const balance = await token.balanceOf(owner.address);
  console.log("Token 餘額:", balance);
}

async function checkUserLock() {
  const [owner] = await ethers.getSigners();
  console.log("合約擁有者:", owner.address);

  const tokenAddress = "0x58197663442cad0fcA87A19Cf5d11685c51e8862";
  const lockAddress = "0x3A9ccf6E6e92F8BfCE3763aC2fAB82Fd8fafdB73";

  const token = await ethers.getContractAt("MyToken", tokenAddress);
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);

  console.log(
    "鎖定開始時間:",
    new Date(Number(await tokenLock.startTime()) * 1000).toLocaleString()
  );
  console.log(
    "鎖定結束時間:",
    new Date(Number(await tokenLock.endTime()) * 1000).toLocaleString()
  );
  const userLock = await tokenLock.userLocks(owner.address);
  console.log("User Lock:", userLock);
}

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

// Lock().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

unlock().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// checkUserLock().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
