import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用地址部署:", deployer.address);

  // 部署 MockContract
  const MockContract = await ethers.getContractFactory("MockContract");
  const mockContract = await MockContract.deploy();
  await mockContract.waitForDeployment();

  const mockContractAddress = await mockContract.getAddress();
  console.log("MockContract 部署於:", mockContractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
