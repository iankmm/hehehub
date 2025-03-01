// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {HeheMeme} from "../src/HeheMeme.sol";

contract DeployHeheMemeV2 is Script {
    function run() external returns (HeheMeme) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy HeheMeme
        HeheMeme heheMeme = new HeheMeme();
        
        vm.stopBroadcast();
        
        return heheMeme;
    }
}
