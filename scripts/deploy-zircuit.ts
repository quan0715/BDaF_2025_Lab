import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用賬戶部署:", deployer.address);
  console.log(
    "賬戶餘額:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 部署 MyToken 合約
  console.log("\n部署 MyToken...");
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("MyToken 部署在:", tokenAddress);

  // 部署 TokenLock 合約
  console.log("\n部署 TokenLock...");
  const TokenLock = await ethers.getContractFactory("TokenLock");
  const tokenLock = await TokenLock.deploy(tokenAddress);
  await tokenLock.waitForDeployment();
  const lockAddress = await tokenLock.getAddress();
  console.log("TokenLock 部署在:", lockAddress);

  // 轉移代幣到 TokenLock 合約作為獎勵池
  console.log("\n轉移獎勵代幣到 TokenLock...");
  const transferAmount = ethers.parseEther("10000000"); // 1000萬代幣
  const transferTx = await myToken.transfer(lockAddress, transferAmount);
  await transferTx.wait();
  console.log(`轉移了 ${ethers.formatEther(transferAmount)} 代幣到 TokenLock`);

  // 顯示部署信息
  console.log("\n部署摘要:");
  console.log("--------------------");
  console.log("網絡: Zircuit 測試網");
  console.log("MyToken 地址:", tokenAddress);
  console.log("TokenLock 地址:", lockAddress);
  console.log("--------------------");
  console.log("下一步: 驗證合約");
  console.log(`npx hardhat verify --network zircuit ${tokenAddress}`);
  console.log(
    `npx hardhat verify --network zircuit ${lockAddress} ${tokenAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
