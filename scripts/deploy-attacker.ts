import { ethers } from "hardhat";

async function main() {
  // 獲取已部署的 OnsiteW2Lab1Flags 合約地址
  const flagsContractAddress = "0x4Ee5C4Ab799404Dc474B8509b07C5a2E38F314F6";

  if (!flagsContractAddress) {
    throw new Error("請先設置環境變數 FLAGS_CONTRACT_ADDRESS");
  }

  console.log("部署 Exploit 合約中...");
  console.log("目標 OnsiteW2Lab1Flags 合約地址:", flagsContractAddress);

  const [deployer] = await ethers.getSigners();
  console.log("部署地址:", deployer.address);

  // 部署攻擊合約
  const Exploit = await ethers.getContractFactory("Exploit");
  const attackerContract = await Exploit.deploy(flagsContractAddress);
  await attackerContract.waitForDeployment();

  const attackerAddress = await attackerContract.getAddress();
  console.log("Exploit 合約部署成功:", attackerAddress);

  return { attackerAddress };
}

// 執行部署
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
