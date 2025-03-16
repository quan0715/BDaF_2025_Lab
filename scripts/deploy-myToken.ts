import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`使用帳號: ${deployer.address}`);

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("MyToken部署在:", tokenAddress);
}

main().catch((error) => {
  console.error(error);
});
