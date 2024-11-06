import { ethers, network } from "hardhat";
import { tokenConfig } from "../config/token-config";
import * as fs from "fs";
import * as path from "path";
import { Wallet } from "ethers";

const WRON_ADDRESS = "0xA959726154953bAe111746E265E6d754F48570E6";

/**
 * This script will verify if the Token created the LP
 * If we can open the LP, it will
 * If we can claim tokens from the LP, it will
 */
async function main() {
  const [owner, deployer] = await ethers.getSigners();

  console.log(`Verification for the wallet: ${deployer.address}`);
  const tokenAddress = "0x21252823bcaa9C05Cc26BC84F4cB69d35A4A4651";
  const token = await ethers.getContractAt("MyToken", tokenAddress);
  const contractPoolSeederAddr = await token.getPoolSeederAddress();
  console.log("Pool address:", contractPoolSeederAddr);

  // Check if the pool is seeded
  const poolSeederContract = await ethers.getContractAt(
    "InitialPoolSeeder",
    contractPoolSeederAddr,
    deployer
  );
  const isSeeded = await poolSeederContract.poolSeeded();
  console.log("Pool seeded:", isSeeded);

  // Check the WRON balance of the wallet
  const wron = await ethers.getContractAt("IERC20", WRON_ADDRESS);
  const wronBalance = await wron.balanceOf(contractPoolSeederAddr);
  console.log(
    `WRON balance of the wallet: ${ethers.formatEther(wronBalance)} WRON`
  );

  const remainingTokensNeeded =
    await poolSeederContract.remainingTokensNeeded();
  console.log("Remaining tokens needed:", remainingTokensNeeded);

  try {
    const claimEnabled = await poolSeederContract.claimEnabled();
    if (claimEnabled) {
      const canClaim = await poolSeederContract.claimAirdrop();
      console.log("Can claim the airdrop:", canClaim);
    } else {
      console.log(`The claim is not yet open.`);

      if (remainingTokensNeeded === 0n) {
        console.log(
          "The RON balance is sufficient to seed the pool. Seeding the pool in progress..."
        );
        const seedTx = await poolSeederContract.seedLiquidityPool();
        await seedTx.wait();
        console.log("The pool has been successfully seeded!");
        console.log("Restart the script to claim");
      } else {
        console.log("The RON balance is not sufficient to seed the pool.");
      }
    }
  } catch (error: any) {
    console.error("Error during claim verification:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
