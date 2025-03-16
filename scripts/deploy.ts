import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
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
