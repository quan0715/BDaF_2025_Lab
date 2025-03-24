import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用賬戶部署:", deployer.address);
  console.log(
    "賬戶餘額:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 部署 QuanToken 合約
  console.log("\n部署 QuanToken...");
  const QuanToken = await ethers.getContractFactory("QuanToken");
  const quanToken = await QuanToken.deploy();
  await quanToken.waitForDeployment();
  const tokenAddress = await quanToken.getAddress();
  console.log("QuanToken 部署在:", tokenAddress);

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
  // const transferTx = await myToken.transfer(lockAddress, transferAmount);
  // await transferTx.wait();
  // console.log(`轉移了 ${ethers.formatEther(transferAmount)} 代幣到 TokenLock`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
