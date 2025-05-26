import { ethers } from "hardhat";
import { TestTokenA, TestTokenB, FixedRateSwap } from "../typechain-types";

async function main() {
  console.log("🔄 演示固定兌換比例 Swap 合約功能...\n");

  // 合約地址（從部署腳本輸出中獲取）
  const tokenAAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tokenBAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const swapAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  // 獲取簽名者
  const [deployer, user1] = await ethers.getSigners();
  console.log(`👤 部署者: ${deployer.address}`);
  console.log(`👤 用戶1: ${user1.address}\n`);

  // 連接到已部署的合約
  const tokenA = (await ethers.getContractAt(
    "TestTokenA",
    tokenAAddress
  )) as TestTokenA;
  const tokenB = (await ethers.getContractAt(
    "TestTokenB",
    tokenBAddress
  )) as TestTokenB;
  const swap = (await ethers.getContractAt(
    "FixedRateSwap",
    swapAddress
  )) as FixedRateSwap;

  // 為 user1 鑄造一些代幣用於測試
  console.log("🎁 為用戶鑄造測試代幣...");
  await tokenA.mintForTest(user1.address, ethers.parseEther("100"));
  await tokenB.mintForTest(user1.address, ethers.parseEther("300"));
  console.log("✅ 代幣鑄造完成\n");

  // 查看初始餘額
  console.log("💰 初始餘額:");
  const initialBalanceA = await tokenA.balanceOf(user1.address);
  const initialBalanceB = await tokenB.balanceOf(user1.address);
  console.log(`   User1 TokenA: ${ethers.formatEther(initialBalanceA)}`);
  console.log(`   User1 TokenB: ${ethers.formatEther(initialBalanceB)}\n`);

  // 查看合約儲備
  const [reserveA, reserveB] = await swap.getReserves();
  console.log("🏦 合約儲備:");
  console.log(`   TokenA: ${ethers.formatEther(reserveA)}`);
  console.log(`   TokenB: ${ethers.formatEther(reserveB)}\n`);

  // 測試 1: TokenA 兌換 TokenB
  console.log("🔄 測試 1: 兌換 10 TokenA -> TokenB");
  const swapAmountA = ethers.parseEther("10");

  // 計算預期輸出
  const expectedAmountB = await swap.getAmountOut(swapAmountA, tokenAAddress);
  console.log(`   預期獲得: ${ethers.formatEther(expectedAmountB)} TokenB`);

  // 授權和執行兌換
  await tokenA.connect(user1).approve(swapAddress, swapAmountA);
  await swap.connect(user1).swapAToB(swapAmountA);
  console.log("✅ 兌換完成\n");

  // 查看兌換後餘額
  const balanceA1 = await tokenA.balanceOf(user1.address);
  const balanceB1 = await tokenB.balanceOf(user1.address);
  console.log("💰 兌換後餘額:");
  console.log(
    `   User1 TokenA: ${ethers.formatEther(
      balanceA1
    )} (變化: ${ethers.formatEther(balanceA1 - initialBalanceA)})`
  );
  console.log(
    `   User1 TokenB: ${ethers.formatEther(
      balanceB1
    )} (變化: ${ethers.formatEther(balanceB1 - initialBalanceB)})\n`
  );

  // 測試 2: TokenB 兌換 TokenA
  console.log("🔄 測試 2: 兌換 60 TokenB -> TokenA");
  const swapAmountB = ethers.parseEther("60"); // 必須是 3 的倍數

  // 計算預期輸出
  const expectedAmountA = await swap.getAmountOut(swapAmountB, tokenBAddress);
  console.log(`   預期獲得: ${ethers.formatEther(expectedAmountA)} TokenA`);

  // 授權和執行兌換
  await tokenB.connect(user1).approve(swapAddress, swapAmountB);
  await swap.connect(user1).swapBToA(swapAmountB);
  console.log("✅ 兌換完成\n");

  // 查看最終餘額
  const finalBalanceA = await tokenA.balanceOf(user1.address);
  const finalBalanceB = await tokenB.balanceOf(user1.address);
  console.log("💰 最終餘額:");
  console.log(
    `   User1 TokenA: ${ethers.formatEther(
      finalBalanceA
    )} (總變化: ${ethers.formatEther(finalBalanceA - initialBalanceA)})`
  );
  console.log(
    `   User1 TokenB: ${ethers.formatEther(
      finalBalanceB
    )} (總變化: ${ethers.formatEther(finalBalanceB - initialBalanceB)})\n`
  );

  // 查看最終合約儲備
  const [finalReserveA, finalReserveB] = await swap.getReserves();
  console.log("🏦 最終合約儲備:");
  console.log(
    `   TokenA: ${ethers.formatEther(
      finalReserveA
    )} (變化: ${ethers.formatEther(finalReserveA - reserveA)})`
  );
  console.log(
    `   TokenB: ${ethers.formatEther(
      finalReserveB
    )} (變化: ${ethers.formatEther(finalReserveB - reserveB)})\n`
  );

  // 測試 3: 嘗試無效兌換（不是 3 的倍數）
  console.log("❌ 測試 3: 嘗試兌換 100 TokenB（不是 3 的倍數）");
  try {
    const invalidAmount = ethers.parseEther("100");
    await tokenB.connect(user1).approve(swapAddress, invalidAmount);
    await swap.connect(user1).swapBToA(invalidAmount);
    console.log("❌ 意外成功！這不應該發生");
  } catch (error: any) {
    console.log(
      `✅ 按預期失敗: ${
        error.message.includes("3 的倍數")
          ? "TokenB 數量必須是 3 的倍數"
          : "兌換失敗"
      }\n`
    );
  }

  console.log("🎉 演示完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 演示失敗:", error);
    process.exit(1);
  });
