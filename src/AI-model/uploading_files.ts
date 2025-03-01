require("dotenv").config();
const { FlatDirectory } = require("ethstorage-sdk");
const { NodeFile } = require("ethstorage-sdk/file");
const path = require("path");
const address = "0xf0bfBd62c0cF753C8aAE8f1670BCbFFd90A94a27"; // FlatDirectory address

const rpc = "https://base-sepolia.g.alchemy.com/v2/Pvip8E8YQyoPXSaFg4PzIj2zTWZcCIrm";
// For Sepolia:
// const rpc = "https://rpc.sepolia.org";
const privateKey = process.env.AIDEN_PRIVATE_KEY;

async function uploadFile() {
    try {
      // Initialize FlatDirectory with contract address
      const flatDirectory = await FlatDirectory.create({ rpc, privateKey, address });
  
      // Load the file
  
      const file = new NodeFile("/Users/sgtsong/Github/hehehub/src/AI-model/hehe.jpg");
      // Callback for tracking progress
      const callback = {
        onProgress: (progress, count) => {
          console.log(`📤 Uploading: ${progress.toFixed(2)}% (${count} chunks)`);
        },
        onFail: (err) => {
          console.error("❌ Upload failed:", err);
        },
        onFinish: (totalChunks, totalSize, totalCost) => {
          console.log(`✅ Upload complete!`);
          console.log(`🔹 Chunks uploaded: ${totalChunks}`);
          console.log(`🔹 Total size: ${totalSize} bytes`);
          console.log(`🔹 Storage cost: ${totalCost} ETH`);
        }
      };
  
      // Upload request
      const request = {
        key: "test", // Unique file key
        content: file,
        type: 2, // Regular file
        callback: callback
      };
  
      // Start upload
      await flatDirectory.upload(request);
    } catch (error) {
      console.error("❌ Error during upload:", error);
    }
  }
  
  // Run the upload function
  uploadFile();