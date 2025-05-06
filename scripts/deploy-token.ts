import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("account address:", deployer.address);

  const tokenFactory = await ethers.getContractFactory("QuanToken");
  const token = await tokenFactory.deploy();
  console.log("token address:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
