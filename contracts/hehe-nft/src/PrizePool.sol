// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PrizePool is Ownable {
    // Constants for prize distribution
    uint256 private constant FIRST_PLACE_PERCENTAGE = 50;
    uint256 private constant SECOND_PLACE_PERCENTAGE = 30;
    uint256 private constant THIRD_PLACE_PERCENTAGE = 20;
    
    // Address of the HeheMeme contract that can send ETH
    address public heheMemeContract;
    
    event PrizeDistributed(
        address firstPlace,
        uint256 firstPlaceAmount,
        address secondPlace,
        uint256 secondPlaceAmount,
        address thirdPlace,
        uint256 thirdPlaceAmount
    );
    
    constructor() {
        // Initially the owner is the deployer
    }
    
    // Set the HeheMeme contract address

    
    // Allow the contract to receive ETH
    receive() external payable {
    }
    
    // Distribute prizes to winners
    function distributePrizes(
        address firstPlace,
        address secondPlace,
        address thirdPlace
    ) external onlyOwner {
        require(firstPlace != address(0) && secondPlace != address(0) && thirdPlace != address(0), "Invalid addresses");
        require(address(this).balance > 0, "No prizes to distribute");
        
        uint256 totalPrize = address(this).balance;
        
        // Calculate prize amounts
        uint256 firstPlaceAmount = (totalPrize * FIRST_PLACE_PERCENTAGE) / 100;
        uint256 secondPlaceAmount = (totalPrize * SECOND_PLACE_PERCENTAGE) / 100;
        uint256 thirdPlaceAmount = (totalPrize * THIRD_PLACE_PERCENTAGE) / 100;
        
        // Send prizes
        (bool success1, ) = firstPlace.call{value: firstPlaceAmount}("");
        require(success1, "Failed to send first place prize");
        
        (bool success2, ) = secondPlace.call{value: secondPlaceAmount}("");
        require(success2, "Failed to send second place prize");
        
        (bool success3, ) = thirdPlace.call{value: thirdPlaceAmount}("");
        require(success3, "Failed to send third place prize");
        
        emit PrizeDistributed(
            firstPlace,
            firstPlaceAmount,
            secondPlace,
            secondPlaceAmount,
            thirdPlace,
            thirdPlaceAmount
        );
    }
    
    // View total prize pool
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}
