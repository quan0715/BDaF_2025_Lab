import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用帳號:", deployer.address);

  // 部署 ERC20 代幣
  console.log("部署 ERC20 代幣...");
  const Token = await ethers.getContractFactory("QuanToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("代幣部署在:", tokenAddress);

  // 部署工廠合約
  console.log("部署工廠合約...");
  const Factory = await ethers.getContractFactory("TokenFactory");
  const factory = await Factory.deploy(tokenAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("工廠部署在:", factoryAddress);

  // get WithDrawToken creationCode
  const WithDrawToken = await ethers.getContractFactory("WithDrawToken");
  const encodeParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [tokenAddress]
  );
  const bytecode = ethers.concat([WithDrawToken.bytecode, encodeParams]);

  const salt = ethers.keccak256(ethers.toUtf8Bytes("my salt"));
  const predictedAddress = await factory.computeAddress(bytecode, salt);
  console.log("預計計算的提款合約地址:", predictedAddress);

  // 向預計計算地址發送代幣
  console.log("向預計計算地址發送代幣...");
  const amount = ethers.parseEther("1000");
  const tx = await token.transfer(predictedAddress, amount);
  await tx.wait();
  console.log(`成功： 轉移了 ${ethers.formatEther(amount)} 代幣到預計計算地址`);

  // 檢查 predictedAddress 餘額
  const predictedAddressBalance = await token.balanceOf(predictedAddress);
  console.log(
    "predictedAddress Token餘額:",
    ethers.formatEther(predictedAddressBalance)
  );

  // 部署提款合約
  console.log("部署提款合約...");
  const deployTx = await factory.deployContract(bytecode, salt);
  await deployTx.wait();
  console.log("提款合約部署在:", predictedAddress);

  // 檢查代幣餘額
  const balance = await token.balanceOf(predictedAddress);
  console.log(
    "after deploy predictedAddress Token餘額:",
    ethers.formatEther(balance)
  );
  // check contract owner token balance
  const ownerTokenBalance = await token.balanceOf(deployer.address);
  console.log("合約擁有者代幣餘額:", ethers.formatEther(ownerTokenBalance));

  // 從提款合約提取代幣
  console.log("從提款合約提取代幣...");
  const withDrawAmount = ethers.parseEther("100");
  const WithDrawTokenContract = WithDrawToken.attach(predictedAddress);
  await WithDrawTokenContract.withdrawToken(withDrawAmount);
  console.log(
    `成功: 從提款合約提取了 ${ethers.formatEther(withDrawAmount)} 代幣`
  );

  // 檢查餘額
  const finalBalance = await token.balanceOf(predictedAddress);
  console.log("WithDraw 提款合約最終餘額:", ethers.formatEther(finalBalance));

  // 檢查提款合約的擁有者餘額
  const ownerBalance = await token.balanceOf(deployer.address);
  console.log("Contract Owner Token餘額:", ethers.formatEther(ownerBalance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
