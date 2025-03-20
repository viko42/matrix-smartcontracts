import 'hardhat-deploy';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      
    },
  },
  namedAccounts: {
    deployer: `privatekey://${process.env.PRIVATE_KEY}`,
    deployerLocker: `privatekey://`,
    feeCollector: "0x674617C5017214dd315003d46Dc36c352F95F3f7",
  },
  networks: {
    ronin: {
      chainId: 2020,
      url: 'https://api.roninchain.com/rpc',
      gasPrice: 21_000_000_000,
      accounts: [process.env.PRIVATE_KEY!],
    },
    saigon: {
      chainId: 2021,
      url: 'https://saigon-testnet.roninchain.com/rpc',
      gasPrice: 21_000_000_000,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.roninchain.com/server/",
    browserUrl: "https://sourcify.roninchain.com",
  },
};

export default config;
