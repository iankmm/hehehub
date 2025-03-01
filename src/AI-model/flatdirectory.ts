require("dotenv").config();
//const { FlatDirectory } = require("ethstorage-sdk");

// const rpc = "https://base-sepolia.g.alchemy.com/v2/Pvip8E8YQyoPXSaFg4PzIj2zTWZcCIrm";
// // For Sepolia:
// // const rpc = "https://rpc.sepolia.org";
// const privateKey = process.env.AIDEN_PRIVATE_KEY;

async function deployFlatDirectory() {
    try {
      const flatDirectory = await FlatDirectory.create({ rpc, privateKey });
      const contractAddress = await flatDirectory.deploy();
      console.log(`FlatDirectory deployed at: ${contractAddress}`);
    } catch (error) {
      console.error("Deployment failed:", error);
    }
  }
  
  // Run the function
  deployFlatDirectory();

  //FlatDirectory address : 0xf0bfBd62c0cF753C8aAE8f1670BCbFFd90A94a27