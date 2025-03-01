// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title BondingCurveToken
 * @dev Implementation of a token with a linear bonding curve
 * Price = basePrice + (supply * priceIncrease)
 */
contract BondingCurveToken is ERC20, ReentrancyGuard, Ownable {
    uint256 public constant BASE_PRICE = 0.001 ether;    // Starting price
    uint256 public constant PRICE_INCREASE = 0.0001 ether; // Price increase per token
    uint256 public constant INITIAL_SUPPLY = 1000 * 10**18; // 1000 tokens
    
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 reward);
    
    constructor() ERC20("Bonding Curve Token", "BCT") {
        _mint(address(this), INITIAL_SUPPLY);
    }
    
    /**
     * @dev Returns the current price for purchasing tokens
     * @param amount Amount of tokens to purchase
     */
    function getCurrentPrice(uint256 amount) public view returns (uint256) {
        uint256 supply = totalSupply() - balanceOf(address(this));
        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < amount; i++) {
            totalCost += BASE_PRICE + ((supply + i) * PRICE_INCREASE);
        }
        
        return totalCost;
    }
    
    /**
     * @dev Returns the current sell price for tokens
     * @param amount Amount of tokens to sell
     */
    function getCurrentSellPrice(uint256 amount) public view returns (uint256) {
        uint256 supply = totalSupply() - balanceOf(address(this));
        require(supply >= amount, "Not enough tokens in circulation");
        
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < amount; i++) {
            totalReward += BASE_PRICE + ((supply - i - 1) * PRICE_INCREASE);
        }
        
        return totalReward;
    }
    
    /**
     * @dev Purchase tokens from the contract
     * @param amount Amount of tokens to purchase
     */
    function buyTokens(uint256 amount) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(address(this)) >= amount, "Not enough tokens in reserve");
        
        uint256 cost = getCurrentPrice(amount);
        require(msg.value >= cost, "Insufficient payment");
        
        // Transfer tokens from contract to buyer
        _transfer(address(this), msg.sender, amount);
        
        // Refund excess payment
        if (msg.value > cost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - cost}("");
            require(success, "Refund failed");
        }
        
        emit TokensPurchased(msg.sender, amount, cost);
    }
    
    /**
     * @dev Sell tokens back to the contract
     * @param amount Amount of tokens to sell
     */
    function sellTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 reward = getCurrentSellPrice(amount);
        require(address(this).balance >= reward, "Insufficient contract balance");
        
        // Transfer tokens from seller to contract
        _transfer(msg.sender, address(this), amount);
        
        // Transfer ETH to seller
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward transfer failed");
        
        emit TokensSold(msg.sender, amount, reward);
    }
    
    /**
     * @dev Withdraw excess ETH from the contract (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
