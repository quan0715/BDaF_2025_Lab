import { ethers } from "hardhat";

async function main() {
  const [deployer, addr1, addr2] = await ethers.getSigners();
  console.log(`使用帳號: ${deployer.address}`);

  console.log("部署QuanToken...");
  const QuanToken = await ethers.getContractFactory("QuanToken");
  const quanToken = await QuanToken.deploy();
  await quanToken.waitForDeployment();
  const tokenAddress = await quanToken.getAddress();
  console.log("QuanToken部署在:", tokenAddress);

  console.log("部署WithDrawToken...");
  const WithDrawToken = await ethers.getContractFactory("WithDrawToken");
  const withDrawToken = await WithDrawToken.deploy(tokenAddress);
  await withDrawToken.waitForDeployment();
  const withDrawTokenAddress = await withDrawToken.getAddress();
  console.log("WithDrawToken部署在:", withDrawTokenAddress);

  // 分配一些QTK给WithDrawToken

  const quanTokenAmount = ethers.parseEther("1000000");
  await quanToken.transfer(withDrawTokenAddress, quanTokenAmount);
  console.log("分配QTK给WithDrawToken:", quanTokenAmount);

  // 檢查WithDrawToken的餘額
  const withDrawTokenBalance = await quanToken.balanceOf(withDrawTokenAddress);
  console.log("WithDrawToken餘額:", withDrawTokenBalance);
  // 查看 deployer 的餘額
  const deployerBalance = await quanToken.balanceOf(deployer.address);
  console.log("deployer餘額:", deployerBalance);

  // WithDrawToken 提款
  const withdrawAmount = ethers.parseEther("10000");
  await withDrawToken.withdrawToken(withdrawAmount);

  // 檢查WithDrawToken的餘額
  const withDrawContractBalanceAfterWithdraw = await quanToken.balanceOf(
    withDrawTokenAddress
  );
  console.log("WithDrawToken餘額:", withDrawContractBalanceAfterWithdraw);

  // 檢查 deployer 的餘額
  const deployerBalanceAfterWithdraw = await quanToken.balanceOf(
    deployer.address
  );
  console.log("deployer餘額:", deployerBalanceAfterWithdraw);
}

main().catch((error) => {
  console.error(error);
});
