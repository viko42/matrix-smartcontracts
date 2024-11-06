import { ethers, network } from "hardhat";
import { tokenConfig } from '../config/token-config';
import path from "path";
import fs from "fs";

/**
 * This script will deploy a new contract using the latest Token Factory
 * Name and Symbol from tokenConfig will be used to create the ERC20 Token
 */
async function main() {
  const [owner, deployer] = await ethers.getSigners();

  const TokenFactory = await ethers.getContractFactory("TokenFactory", deployer);
  console.log(`Contract used: ${tokenConfig.tokenFactoryAddress[network.name]}`)
  const factory = TokenFactory.attach(tokenConfig.tokenFactoryAddress[network.name]);
  
  const tx = await factory.deployTokenV2(
    tokenConfig.name,
    tokenConfig.symbol,
    tokenConfig.initialSupply,
    { value: ethers.parseEther("0.1") }
  );

  await tx.wait();
  await new Promise(resolve => setTimeout(resolve, 5000));
  const [tokenDeployedAddr] = await factory.getTokenAddresses([tokenConfig.symbol]);

  console.log(`New token deployed at: ${tokenDeployedAddr}`);

  const configPath = path.join(__dirname, '../config/token-config.ts');
  const config = require('../config/token-config').tokenConfig;
  
  if (!config.tokensDeployed) config.tokensDeployed = {};
  if (!config.tokensDeployed[network.name]) config.tokensDeployed[network.name] = [];
  config.tokensDeployed[network.name].push({
    address: tokenDeployedAddr,
    name: tokenConfig.name,
    symbol: tokenConfig.symbol,
    initialSupply: tokenConfig.initialSupply,
  })
  
  const configContent = `export const tokenConfig = ${JSON.stringify(config, null, 4)};`;
  fs.writeFileSync(configPath, configContent);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 