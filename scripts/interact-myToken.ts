import { ethers } from "hardhat";

async function main() {
  // set token address
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // get signers
  const [owner, addr1, addr2] = await ethers.getSigners();
  console.log(`使用帳號: ${owner.address}`);

  // get contract instance
  const myToken = await ethers.getContractAt("MyToken", tokenAddress);

  console.log(`Token Name: ${await myToken.name()}`);
  console.log(`Token Symbol: ${await myToken.symbol()}`);
  console.log(`Decimals: ${await myToken.decimals()}`);
  // check totalSupply
  const totalSupply = await myToken.totalSupply();
  console.log(`Total Supply: ${ethers.formatEther(totalSupply)}`);

  // check owner balance
  const ownerBalance = await myToken.balanceOf(owner.address);
  console.log(`Owner Balance: ${ethers.formatEther(ownerBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
