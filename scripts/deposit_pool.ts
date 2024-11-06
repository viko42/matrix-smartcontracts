import { ethers } from "hardhat";

const POOL_SEEDER_ABI = [
    "function depositTokens() external payable"
];

const TOKEN_ABI = [
    "function getPoolSeederAddress() external view returns (address)"
];

/**
 * This script will deposit $RON into the pool contract of the token
 */
async function depositOneWron() {
    const [owner, deployer] = await ethers.getSigners();
    
    const provider = new ethers.JsonRpcProvider('https://saigon-testnet.roninchain.com/rpc');
    const TOKEN_ADDRESS = '0x21252823bcaa9C05Cc26BC84F4cB69d35A4A4651';
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, deployer);

    try {
        const poolSeederAddress = await tokenContract.getPoolSeederAddress();
        console.log("PoolSeeder address:", poolSeederAddress);
    
        const balanceAddress = await provider.getBalance(deployer.address);
        console.log(`Balance deployer: ${deployer.address} is ${ethers.formatEther(balanceAddress)} $RON`);

        // Instance contract PoolSeeder
        const poolSeederContract = new ethers.Contract(poolSeederAddress, POOL_SEEDER_ABI, deployer);
    
        const amount = ethers.parseEther("0.1");
        const depositTx = await poolSeederContract.depositTokens({ 
            value: amount,
            gasLimit: 500000,
            gasPrice: ethers.parseUnits('20', 'gwei'),
        });
        
        await depositTx.wait();
        console.log("Successfully deposited RON!");
    
    } catch (error) {
        console.error("Error during deposit:", error);
    }
}

depositOneWron()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });