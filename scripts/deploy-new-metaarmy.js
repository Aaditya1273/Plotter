const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const network = hre.network.name;
    console.log(`🚀 Deploying MetaArmy and MetaArmyToken to ${network}...`);

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // 1. Deploy MetaArmyToken
    console.log("\n💰 Deploying MetaArmyToken...");
    const MetaArmyToken = await ethers.getContractFactory("MetaArmyToken");
    const armyToken = await MetaArmyToken.deploy();
    await armyToken.waitForDeployment();
    const armyTokenAddress = await armyToken.getAddress();
    console.log("✅ MetaArmyToken deployed to:", armyTokenAddress);

    // 2. Deploy MetaArmy
    console.log("\n📄 Deploying MetaArmy...");
    const MetaArmy = await ethers.getContractFactory("MetaArmy");
    const metaArmy = await MetaArmy.deploy(armyTokenAddress);
    await metaArmy.waitForDeployment();
    const metaArmyAddress = await metaArmy.getAddress();
    console.log("✅ MetaArmy deployed to:", metaArmyAddress);

    // Update .env.local
    const envContent = `
# New MetaArmy Deployment - ${new Date().toLocaleString()}
NEXT_PUBLIC_META_ARMY_ADDRESS=${metaArmyAddress}
NEXT_PUBLIC_ARMY_TOKEN_ADDRESS=${armyTokenAddress}
NEXT_PUBLIC_META_PLOT_AGENT_ADDRESS=${metaArmyAddress}
`;
    fs.appendFileSync('.env.local', envContent);
    console.log("\n✅ Environment file updated");

    console.log("\n🎉 Deployment Complete!");
    console.log("MetaArmy:", metaArmyAddress);
    console.log("MetaArmyToken:", armyTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
