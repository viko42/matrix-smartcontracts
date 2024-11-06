import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import fs from 'fs';
import path from 'path';
  
/**
 * This deployment script is not used currently
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying TokenFactoryV2...");
  const deployResult = await deploy('TokenFactoryV2', {
    from: deployer,
    contract: 'TokenFactoryV2',
    log: true,
  });

  console.log("TokenFactoryV2 deployed to:", deployResult.address);
  
  const configPath = path.join(__dirname, '../config/token-config.ts');
  const config = require('../config/token-config').tokenConfig;
  
  if (!config.tokenFactoryV2Address) config.tokenFactoryV2Address = {};
  
  config.tokenFactoryV2Address[hre.network.name] = deployResult.address;
  
  const configContent = `export const tokenConfig = ${JSON.stringify(config, null, 4)};`;
  fs.writeFileSync(configPath, configContent);
  
  console.log(`Updated token-config.ts with new address for network ${hre.network.name}`);
};

func.tags = ["TokenFactoryV2"];
func.dependencies = ['VerifyContracts'];

export default func;