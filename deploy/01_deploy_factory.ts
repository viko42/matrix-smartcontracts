import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import fs from 'fs';
import path from 'path';
  
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // const routerAddress = "0x3918E7b2b1e7fE3B3BA90d08BFaaE808cb00746D"; // Uniswap
  const routerAddress = "0x3bd36748d17e322cfb63417b059bcc1059012d83" // Ronin
  const WRON_ADDRESS = "0xA959726154953bAe111746E265E6d754F48570E6";

  console.log("Deploying TokenFactory...");
  const deployResult = await deploy('TokenFactoryKatana', {
    from: deployer,
    contract: 'TokenFactory',
    log: true,
    args: [
      routerAddress, WRON_ADDRESS
    ]
  });

  
  console.log("TokenFactory deployed to:", deployResult.address);
  
  const configPath = path.join(__dirname, '../config/token-config.ts');
  const config = require('../config/token-config').tokenConfig;
  
  if (!config.tokenFactoryAddress) config.tokenFactoryAddress = {};
  config.tokenFactoryAddress[hre.network.name] = deployResult.address;
  config.tokensDeployed = {};
  
  const configContent = `export const tokenConfig = ${JSON.stringify(config, null, 4)};`;
  fs.writeFileSync(configPath, configContent);
  
  console.log(`Updated token-config.ts with new address for network ${hre.network.name}`);
};

func.tags = ["TokenFactory"];
func.dependencies = ['VerifyContracts'];

export default func;