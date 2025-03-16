import { ethers } from "hardhat";
import { Wallet } from "ethers";

const owner = new Wallet(process.env.PRIVATE_KEY || "", ethers.provider);
const alice = new Wallet(process.env.ALICE_PRIVATE_KEY || "", ethers.provider);
const bob = new Wallet(process.env.BOB_PRIVATE_KEY || "", ethers.provider);
const tokenAddress = "0x58197663442cad0fcA87A19Cf5d11685c51e8862";
const lockAddress = "0x3A9ccf6E6e92F8BfCE3763aC2fAB82Fd8fafdB73";

async function main() {
  console.log("合約擁有者:", owner.address);
  console.log("Alice:", alice.address);
  console.log("Bob:", bob.address);
  //   const myToken = await ethers.getContractAt("MyToken", tokenAddress);
  //   const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);

  //   console.log("\n設置鎖定時間...");
  //   const currentTime = Math.floor(Date.now() / 1000);
  //   const startTime = currentTime + 60; // 1分鐘後開始
  //   const endTime = startTime + 60; // 2分鐘後結束

  //   await tokenLock.setStartTime(startTime);
  //   await tokenLock.setEndTime(endTime);

  //   const contractStartTime = await tokenLock.startTime();
  //   const contractEndTime = await tokenLock.endTime();
  //   console.log(
  //     "鎖定開始時間:",
  //     new Date(Number(contractStartTime) * 1000).toLocaleString()
  //   );
  //   console.log(
  //     "鎖定結束時間:",
  //     new Date(Number(contractEndTime) * 1000).toLocaleString()
  //   );

  // await Lock(alice);
  //   await Lock(bob);

  //   await tradeUserFunds(bob);
  //   await unlock(alice);
  await unlock(bob);
}

async function Lock(wallet: Wallet, amount: string = "0.0000000000000001") {
  // a user (Alice) locking their ETH into the contract
  console.log("鎖定者:", wallet.address);
  console.log("鎖定 ETH 到合約...");
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);
  const tx = await tokenLock.connect(wallet).lock({
    value: ethers.parseEther(amount),
  });
  const receipt = await tx.wait();
  console.log("交易結果:", receipt);
}

async function unlock(wallet: Wallet) {
  console.log("解鎖者:", wallet.address);
  console.log("解鎖合約...");
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);
  const tx = await tokenLock.connect(wallet).unlock();
  const receipt = await tx.wait();
  console.log("交易結果:", receipt);
}

async function tradeUserFunds(wallet: Wallet) {
  console.log("合約擁有者:", owner.address);
  console.log("交易者:", wallet.address);
  console.log("交易合約...");
  const tokenLock = await ethers.getContractAt("TokenLock", lockAddress);
  const tx = await tokenLock.connect(owner).tradeUserFunds(wallet.address);
  const receipt = await tx.wait();
  console.log("交易結果:", receipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Lock().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

// unlock().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

// checkUserLock().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
