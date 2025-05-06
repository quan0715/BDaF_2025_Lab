import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// 確保私鑰存在
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    zircuit: {
      // url: "https://lb.drpc.org/ogrpc?network=zircuit-mainnet&dkey=Ak-Z7kImikFJlIL_i3Tid5LqCV3y_X8R76CMnqSgS7QB",
      url: "https://lb.drpc.org/ogrpc?network=zircuit-garfield-testnet&dkey=Ak-Z7kImikFJlIL_i3Tid5LqCV3y_X8R76CMnqSgS7QB",
      accounts: [PRIVATE_KEY],
    },
  },

  etherscan: {
    enabled: true,
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.dev/server",
    browserUrl: "https://repo.sourcify.dev",
  },
};

export default config;
