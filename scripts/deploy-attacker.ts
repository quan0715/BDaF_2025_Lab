import { ethers } from "hardhat";

async function main() {
  // 合約地址
  const tokenAddress = "0x0CB70e82cDA48ac413d15dDb5782130F57ef8844";
  const flashloanAddress = "0x19839DfeCA322bb9Ea042bb2154fe3C77c93E857";
  const whalebadgeAddress = "0xac9a1d6E3452D55dc42aBB8AE3ACEAd98C089FAc";

  // 部署攻擊合約
  const Attacker = await ethers.getContractFactory(
    "WhaleBadgeFlashloanAttacker"
  );
  const attacker = await Attacker.deploy(
    flashloanAddress,
    whalebadgeAddress,
    tokenAddress
  );

  await attacker.waitForDeployment();
  console.log("攻擊合約已部署到:", await attacker.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
