import { ethers } from "hardhat";
import { TestTokenA, TestTokenB, FixedRateSwap } from "../typechain-types";

async function main() {
  console.log("🚀 開始部署固定兌換比例 Swap 合約...");

  // 獲取部署者帳戶
  const [deployer] = await ethers.getSigners();
  console.log(`📝 部署者地址: ${deployer.address}`);
  console.log(
    `💰 部署者餘額: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );

  // 部署 TestTokenA
  console.log("\n📦 部署 TestTokenA...");
  const TestTokenAFactory = await ethers.getContractFactory("TestTokenA");
  const tokenA = (await TestTokenAFactory.deploy()) as TestTokenA;
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log(`✅ TestTokenA 部署完成: ${tokenAAddress}`);

  // 部署 TestTokenB
  console.log("\n📦 部署 TestTokenB...");
  const TestTokenBFactory = await ethers.getContractFactory("TestTokenB");
  const tokenB = (await TestTokenBFactory.deploy()) as TestTokenB;
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log(`✅ TestTokenB 部署完成: ${tokenBAddress}`);

  // 部署 FixedRateSwap
  console.log("\n📦 部署 FixedRateSwap...");
  const FixedRateSwapFactory = await ethers.getContractFactory("FixedRateSwap");
  const fixedRateSwap = (await FixedRateSwapFactory.deploy(
    tokenAAddress,
    tokenBAddress
  )) as FixedRateSwap;
  await fixedRateSwap.waitForDeployment();
  const swapAddress = await fixedRateSwap.getAddress();
  console.log(`✅ FixedRateSwap 部署完成: ${swapAddress}`);

  // 為 swap 合約添加初始流動性
  console.log("\n💧 添加初始流動性...");
  const liquidityA = ethers.parseEther("10000"); // 10,000 TokenA
  const liquidityB = ethers.parseEther("30000"); // 30,000 TokenB (1:3 比例)

  // 授權 swap 合約使用代幣
  console.log("🔐 授權代幣轉移...");
  await tokenA.approve(swapAddress, liquidityA);
  await tokenB.approve(swapAddress, liquidityB);

  // 添加流動性
  const tx = await fixedRateSwap.addLiquidity(liquidityA, liquidityB);
  await tx.wait();
  console.log(
    `✅ 流動性添加完成: ${ethers.formatEther(
      liquidityA
    )} TokenA + ${ethers.formatEther(liquidityB)} TokenB`
  );

  // 查看儲備量
  const [reserveA, reserveB] = await fixedRateSwap.getReserves();
  console.log(
    `📊 當前儲備: ${ethers.formatEther(reserveA)} TokenA, ${ethers.formatEther(
      reserveB
    )} TokenB`
  );

  // 輸出部署總結
  console.log("\n🎉 部署完成！");
  console.log("=".repeat(50));
  console.log(`TokenA 地址:    ${tokenAAddress}`);
  console.log(`TokenB 地址:    ${tokenBAddress}`);
  console.log(`Swap 合約地址:  ${swapAddress}`);
  console.log(`兌換比例:       1 TokenA = 3 TokenB`);
  console.log(
    `初始流動性:     ${ethers.formatEther(
      liquidityA
    )} TokenA + ${ethers.formatEther(liquidityB)} TokenB`
  );
  console.log("=".repeat(50));

  // 為測試帳戶鑄造一些代幣
  console.log("\n🎁 為測試帳戶鑄造代幣...");
  const testAmount = ethers.parseEther("1000");
  const testAmountB = ethers.parseEther("3000");

  if (deployer.address) {
    await tokenA.mintForTest(deployer.address, testAmount);
    await tokenB.mintForTest(deployer.address, testAmountB);
    console.log(
      `✅ 為 ${deployer.address} 鑄造了 ${ethers.formatEther(
        testAmount
      )} TokenA 和 ${ethers.formatEther(testAmountB)} TokenB`
    );
  }

  console.log("\n🔗 合約驗證命令:");
  console.log(`npx hardhat verify --network <network> ${tokenAAddress}`);
  console.log(`npx hardhat verify --network <network> ${tokenBAddress}`);
  console.log(
    `npx hardhat verify --network <network> ${swapAddress} ${tokenAAddress} ${tokenBAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失敗:", error);
    process.exit(1);
  });
