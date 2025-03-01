require("dotenv").config();
const { EthStorage } = require("ethstorage-sdk");


// const rpc = "https://base-sepolia.g.alchemy.com/v2/Pvip8E8YQyoPXSaFg4PzIj2zTWZcCIrm";
// const privateKey = process.env.AIDEN_PRIVATE_KEY;


// For Sepolia:
// const ethStorageRpc = "http://65.108.236.27:9540";
const ethStorageRpc = "https://rpc.beta.testnet.l2.ethstorage.io:9596";


async function uploadBlob() {
    try {
      // Initialize EthStorage
      const ethStorage = await EthStorage.create({
        rpc: rpc,
        ethStorageRpc: ethStorageRpc,
        privateKey: privateKey,
      });
  
      // Define the blob key and data
      const key = "test";
      const data = Buffer.from("hehehub 4ever");
  
      console.log("📤 Uploading blob...");
      
      // Write the blob data to EthStorage
      await ethStorage.write(key, data);
  
      console.log(`✅ Blob uploaded successfully with key: ${key}`);
    } catch (error) {
      console.error("❌ Error during upload:", error);
    }
  }
  
  // Run the upload function
  uploadBlob();