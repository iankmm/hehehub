import { defineChain } from "thirdweb/chains";
import { baseSepolia } from "thirdweb/chains";
import { zkSyncSepolia } from "thirdweb/chains";

const flow = defineChain(545);
const ink = defineChain(763373);
// TODO: const u2u = defineChain(2484);
const zircuit = defineChain(48899);



// export const selectedChain = baseSepolia;
// export const selectedChain = zkSyncSepolia;
// export const selectedChain = flow;
// export const selectedChain = ink;
// TODO: export const selectedChain = u2u;
export const selectedChain = zircuit;