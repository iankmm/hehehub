// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/HeheMeme.sol";
import "forge-std/console.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        HeheMeme nft = new HeheMeme();
        console.log("HeheMeme deployed to:", address(nft));
        
        vm.stopBroadcast();
    }
}
