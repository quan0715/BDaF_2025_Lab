import { ethers } from "hardhat";
const tokenAddress = "0xd1F7971eff960fc57C8B396E319fE83481b82830";
const lab1ContractAddress = "0x7b10eFb166EFBD0edDB8800f73fc631148eA1722";
const withdrawToken = "0x0CB70e82cDA48ac413d15dDb5782130F57ef8844";
const lab1Abi = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balances",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "despoit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
async function main() {
  const [deployer] = await ethers.getSigners();
  // 4. Approve 合約可以花費你的 ERC20 代幣
  //   const Token = await ethers.getContractAt("QuanToken", tokenAddress);
  //   const approveTx = await Token.approve(lab1ContractAddress, ethers.MaxUint256);
  //   await approveTx.wait();

  //   console.log("已授權合約可花費你的代幣");
  //   console.log("account address:", deployer.address);

  const lab1Contract = new ethers.Contract(
    lab1ContractAddress,
    lab1Abi,
    deployer
  );
  //   deposit 20 tokens
  //   const res = await lab1Contract.despoit(
  //     tokenAddress,
  //     ethers.parseEther("480")
  //   );
  //   console.log("res:", res);
  //   const tx = await res.wait();
  //   console.log("tx:", tx);

  // withdraw 1000 tokens
  const res = await lab1Contract.withdraw(
    withdrawToken,
    ethers.parseEther("1000")
  );
  console.log("res:", res);
  const tx = await res.wait();
  console.log("tx:", tx);

  // check balance
  const balance = await lab1Contract.balances(deployer.address);
  console.log("balance:", balance);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
