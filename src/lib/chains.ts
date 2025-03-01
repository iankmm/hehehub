import { defineChain } from "thirdweb/chains";
import { baseSepolia } from "thirdweb/chains";
import { zkSyncSepolia } from "thirdweb/chains";

const flow = defineChain(545);
const ink = defineChain(763373);


  
export const selectedChain = baseSepolia;
// export const selectedChain = zkSyncSepolia;
// export const selectedChain = flow;
// export const selectedChain = ink;