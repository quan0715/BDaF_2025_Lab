import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
async function main() {
  const [deployer, alice, bob] = await ethers.getSigners();
  console.log("使用賬戶部署:", deployer.address);

  // 部署 ERC20 代幣
  const { tokenAddress, myToken } = await deployMyToken();

  const { lockAddress, tokenLock } = await deployTokenLock(tokenAddress);

  // 將一些代幣轉移到鎖定合約作為獎勵池
  const transferAmount = ethers.parseEther("1000000");
  await myToken.transfer(lockAddress, transferAmount);
  console.log(`轉移了 ${ethers.formatEther(transferAmount)} 代幣到 TokenLock`);

  // check tokenLock balance
  const tokenLockBalance = await myToken.balanceOf(lockAddress);
  console.log("TokenLock 餘額:", ethers.formatEther(tokenLockBalance));
  const lockData = { value: ethers.parseEther("1") };

  // listen to the Lock event
  tokenLock.on("Lock", (user: string, amount: string) => {
    console.log("Lock Event Success:", user, amount);
  });
  // listen to the TradeUserFunds event
  tokenLock.on("TradeUserFunds", (user: string, amount: string) => {
    console.log("TradeUserFunds Event Success:", user, amount);
  });
  // listen to the Unlock event
  tokenLock.on(
    "Unlock",
    (user: string, ethAmount: string, tokenAmount: string) => {
      console.log("Unlock Event Success:", user, ethAmount, tokenAmount);
    }
  );
  // try to lock token when time is not set and catch error
  try {
    console.log("嘗試在沒有設置時間時鎖定代幣");
    await tokenLock.connect(alice).lock(lockData);
  } catch (error: any) {
    console.log("錯誤:", error.message);
  }

  try {
    console.log("嘗試在以非 owner身份 設定時間");
    await tokenLock.connect(alice).setStartTime((await time.latest()) + 100);
  } catch (error: any) {
    console.log("錯誤:", error.message);
  }

  // owner 設定時間
  const currentTime = await time.latest();
  await tokenLock.setStartTime(currentTime + 2);
  await tokenLock.setEndTime(currentTime + 5);
  console.log(
    `設定開始時間: ${new Date(
      Number(await tokenLock.startTime()) * 1000
    ).toLocaleString()}`
  );
  console.log(
    `設定結束時間: ${new Date(
      Number(await tokenLock.endTime()) * 1000
    ).toLocaleString()}`
  );

  // wait for 10 seconds
  console.log("等待 2 秒");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // try to lock token when time is set and catch error
  await tokenLock.connect(alice).lock(lockData);
  await tokenLock.connect(bob).lock(lockData);

  await tokenLock.connect(deployer).tradeUserFunds(alice.address);

  // get ETH from tokenLock
  await tokenLock.connect(deployer).getETH(ethers.parseEther("1"));
  // check deployer balance
  //   const deployerBalance = await ethers.provider.getBalance(deployer.address);
  //   console.log("deployer balance:", ethers.formatEther(deployerBalance));
  // wait for 2 seconds (end time)
  console.log("等待 3 秒");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  // unlock
  await tokenLock.connect(alice).unlock();
  await tokenLock.connect(bob).unlock();
  // check alice balance
  const aliceBalance = await myToken.balanceOf(alice.address);
  console.log("alice balance:", ethers.formatEther(aliceBalance));
  // check tokenLock balance
  const tokenLockBalanceAfterUnlock = await myToken.balanceOf(lockAddress);

  console.log(
    "TokenLock 餘額:",
    ethers.formatEther(tokenLockBalanceAfterUnlock)
  );

  // check bob balance
}

async function deployMyToken() {
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("MyToken 部署在:", tokenAddress);
  return { tokenAddress, myToken };
}

async function deployTokenLock(tokenAddress: string) {
  const TokenLock = await ethers.getContractFactory("TokenLock");
  const tokenLock = await TokenLock.deploy(tokenAddress);
  await tokenLock.waitForDeployment();
  const lockAddress = await tokenLock.getAddress();
  console.log("TokenLock 部署在:", lockAddress);
  return { lockAddress, tokenLock };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
