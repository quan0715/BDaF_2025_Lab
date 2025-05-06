import { ethers } from "hardhat";
const scoreCheckerContractAddress =
  "0xE29131e292C3c6Eb85068d3d8E5fDEAb23E3981d";

const scoreCheckerAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "lab",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proofOfProxy",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "scores",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "updateScores",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "whalebadge",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("account address:", deployer.address);

  // get balance of deployer
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("balance:", ethers.formatEther(balance));

  const scoreCheckerContract = new ethers.Contract(
    scoreCheckerContractAddress,
    scoreCheckerAbi,
    deployer
  );

  // // update scores
  // const res = await scoreCheckerContract.updateScores();
  // console.log("res:", res);
  // const tx = await res.wait();
  // console.log("tx:", tx);

  const score = await scoreCheckerContract.scores(deployer.address);
  console.log("score:", Number(score));
}

main();
