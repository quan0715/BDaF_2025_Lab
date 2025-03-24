import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  // 這些地址應該存儲在配置文件中或從命令行參數獲取
  // 這里我們假設它們是已知的
  const FACTORY_ADDRESS = "0x25FbB19a3F73a86C5F74c796a4575c7CC252DF9E";
  const TOKEN_ADDRESS = "0x4eA71DA44800B86cffa50b48aBf30284526de064";

  console.log("開始部署更新後的合約到新地址...");

  // 獲取部署者地址
  const [deployer] = await ethers.getSigners();
  console.log(`使用部署者地址: ${deployer.address}`);

  // 1. 連接到工廠合約
  console.log("連接到工廠合約...");
  const factory = await ethers.getContractAt("TokenFactory", FACTORY_ADDRESS);

  // 2. 連接到 ERC20 代幣合約
  console.log("連接到代幣合約...");
  const token = await ethers.getContractAt("QuanToken", TOKEN_ADDRESS);
  const tokenSymbol = await token.symbol();
  console.log(`代幣符號: ${tokenSymbol}`);

  // 3. 獲取更新後的合約字節碼
  console.log("準備更新後的合約字節碼...");
  const WithDrawToken = await ethers.getContractFactory("WithDrawToken");

  // 編碼構造函數參數
  const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [TOKEN_ADDRESS]
  );

  // 合併字節碼和構造函數參數
  const bytecode = ethers.concat([WithDrawToken.bytecode, encodedParams]);

  // 4. 創建唯一的鹽值 (使用時間戳和部署者地址確保唯一性)
  const timestamp = Math.floor(Date.now() / 1000);
  const saltText = `update_${timestamp}_${deployer.address.slice(2, 10)}`;
  const salt = ethers.keccak256(ethers.toUtf8Bytes(saltText));
  console.log(`使用鹽值 (明文): ${saltText}`);
  console.log(`鹽值 (哈希): ${salt}`);

  // 5. 計算新合約的預期地址
  console.log("計算新的部署地址...");
  const predictedAddress = await factory.computeAddress(bytecode, salt);
  console.log(`預計的合約地址: ${predictedAddress}`);

  // 6. (可選) 檢查地址是否已經有代碼
  const codeAtAddress = await ethers.provider.getCode(predictedAddress);
  if (codeAtAddress !== "0x") {
    console.error("警告: 該地址已存在合約代碼!");
    console.log("請使用不同的鹽值再試一次。");
    return;
  }

  // 7. 向新地址發送代幣
  const amount = ethers.parseEther("1000");
  console.log(
    `向新地址發送 ${ethers.formatEther(amount)} ${tokenSymbol} 代幣...`
  );

  const transferTx = await token.transfer(predictedAddress, amount);
  await transferTx.wait();
  console.log(`代幣轉移交易: ${transferTx.hash}`);

  // 確認餘額
  const balanceAfterTransfer = await token.balanceOf(predictedAddress);
  console.log(
    `新地址的代幣餘額: ${ethers.formatEther(
      balanceAfterTransfer
    )} ${tokenSymbol}`
  );

  // 8. 部署新合約
  console.log("開始部署合約...");
  const deployTx = await factory.deployContract(bytecode, salt);
  const receipt = await deployTx.wait();
  console.log(`部署交易: ${deployTx.hash}`);

  // 9. 連接到新部署的合約
  console.log("連接到新部署的合約...");
  const deployedContract = await ethers.getContractAt(
    "WithDrawToken",
    predictedAddress
  );

  // 10. (可選) 與新合約交互
  // 例如，從合約中提取代幣
  console.log("提取代幣...");
  try {
    const withdrawTx = await deployedContract.withdrawToken(amount);
    await withdrawTx.wait();
    console.log(`提款交易: ${withdrawTx.hash}`);

    // 檢查部署者的餘額
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(
      `部署者的代幣餘額: ${ethers.formatEther(deployerBalance)} ${tokenSymbol}`
    );
  } catch (error) {
    console.error("提款失敗:", error);
  }

  // 11. 保存部署信息到文件
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    factory: FACTORY_ADDRESS,
    token: TOKEN_ADDRESS,
    withDrawToken: predictedAddress,
    salt: {
      text: saltText,
      hash: salt,
    },
    deploymentTransaction: deployTx.hash,
  };

  fs.writeFileSync(
    `deployment-${timestamp}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`部署信息已保存到 deployment-${timestamp}.json`);
  console.log("部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失敗:", error);
    process.exit(1);
  });
