const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MetaArmySimple...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy MetaArmySimple
  const MetaArmySimple = await ethers.getContractFactory("MetaArmySimple");
  const metaArmySimple = await MetaArmySimple.deploy();
  await metaArmySimple.waitForDeployment();
  
  const metaArmySimpleAddress = await metaArmySimple.getAddress();
  console.log("✅ MetaArmySimple deployed to:", metaArmySimpleAddress);
  console.log("   Tx Hash:", metaArmySimple.deploymentTransaction().hash);

  // Update .env.local with new address
  const fs = require('fs');
  const envContent = `
# Updated MetaArmySimple Deployment - ${new Date().toLocaleString()}
NEXT_PUBLIC_META_ARMY_SIMPLE_ADDRESS=${metaArmySimpleAddress}
NEXT_PUBLIC_META_ARMY_ADDRESS=${metaArmySimpleAddress}
`;
  
  fs.appendFileSync('.env.local', envContent);
  console.log("\n✅ Environment file (.env.local) updated with new MetaArmySimple address");
  console.log(`\n🎉 MetaArmySimple contract is ready at: ${metaArmySimpleAddress}`);
  
  // Verify on Etherscan (optional)
  console.log("\n📋 To verify on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${metaArmySimpleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });