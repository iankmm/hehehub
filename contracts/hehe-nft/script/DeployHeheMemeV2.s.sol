// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {HeheMeme} from "../src/HeheMeme.sol";
import {PrizePool} from "../src/PrizePool.sol";

contract DeployHeheMemeV2 is Script {
    function run() external returns (HeheMeme, PrizePool) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PrizePool first
        PrizePool prizePool = new PrizePool();
        
        // Deploy HeheMeme
        HeheMeme heheMeme = new HeheMeme();
        
        // Set up contract relationships
        heheMeme.setPrizePool(address(prizePool));
        prizePool.setHeheMemeContract(address(heheMeme));
        
        vm.stopBroadcast();
        
        return (heheMeme, prizePool);
    }
}
