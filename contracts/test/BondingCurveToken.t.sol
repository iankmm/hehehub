// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../BondingCurveToken.sol";

contract BondingCurveTokenTest is Test {
    BondingCurveToken public token;
    address public owner;
    address public alice;
    address public bob;
    
    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        // Deploy contract
        token = new BondingCurveToken();
        
        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }
    
    function test_InitialState() public {
        assertEq(token.name(), "Bonding Curve Token");
        assertEq(token.symbol(), "BCT");
        assertEq(token.totalSupply(), 1000 * 10**18);
        assertEq(token.balanceOf(address(token)), 1000 * 10**18);
    }
    
    function test_GetCurrentPrice() public {
        uint256 price = token.getCurrentPrice(1);
        assertEq(price, 0.001 ether); // Should equal BASE_PRICE for first token
        
        // Price for 2 tokens should be BASE_PRICE + (BASE_PRICE + PRICE_INCREASE)
        uint256 priceForTwo = token.getCurrentPrice(2);
        assertEq(priceForTwo, 0.001 ether + (0.001 ether + 0.0001 ether));
    }
    
    function test_BuyTokens() public {
        vm.startPrank(alice);
        
        // Buy 1 token
        uint256 cost = token.getCurrentPrice(1);
        token.buyTokens{value: cost}(1);
        
        assertEq(token.balanceOf(alice), 1);
        assertEq(address(token).balance, cost);
        
        vm.stopPrank();
    }
    
    function test_BuyTokensWithExcessPayment() public {
        vm.startPrank(alice);
        
        uint256 cost = token.getCurrentPrice(1);
        uint256 excess = 0.1 ether;
        uint256 initialBalance = alice.balance;
        
        token.buyTokens{value: cost + excess}(1);
        
        // Check refund
        assertEq(alice.balance, initialBalance - cost);
        
        vm.stopPrank();
    }
    
    function test_SellTokens() public {
        // First buy tokens
        vm.startPrank(alice);
        uint256 buyAmount = 5;
        uint256 cost = token.getCurrentPrice(buyAmount);
        token.buyTokens{value: cost}(buyAmount);
        
        // Then sell one token
        uint256 sellAmount = 1;
        uint256 balanceBefore = alice.balance;
        token.sellTokens(sellAmount);
        
        // Check balance changes
        assertEq(token.balanceOf(alice), buyAmount - sellAmount);
        assertTrue(alice.balance > balanceBefore); // Should have received ETH
        
        vm.stopPrank();
    }
    
    function test_MultipleTraders() public {
        // Alice buys tokens
        vm.startPrank(alice);
        uint256 aliceBuyAmount = 3;
        uint256 aliceCost = token.getCurrentPrice(aliceBuyAmount);
        token.buyTokens{value: aliceCost}(aliceBuyAmount);
        vm.stopPrank();
        
        // Bob buys tokens (should be more expensive)
        vm.startPrank(bob);
        uint256 bobBuyAmount = 2;
        uint256 bobCost = token.getCurrentPrice(bobBuyAmount);
        assertTrue(bobCost > (aliceCost * bobBuyAmount) / aliceBuyAmount); // Price should have increased
        token.buyTokens{value: bobCost}(bobBuyAmount);
        vm.stopPrank();
        
        assertEq(token.balanceOf(alice), aliceBuyAmount);
        assertEq(token.balanceOf(bob), bobBuyAmount);
    }
    
    function test_RevertWhenInsufficientPayment() public {
        vm.startPrank(alice);
        uint256 amount = 1;
        uint256 cost = token.getCurrentPrice(amount);
        
        vm.expectRevert("Insufficient payment");
        token.buyTokens{value: cost - 1}(amount);
        
        vm.stopPrank();
    }
    
    function test_RevertWhenSellingTooMuch() public {
        vm.startPrank(alice);
        
        vm.expectRevert("Insufficient balance");
        token.sellTokens(1); // Alice has no tokens yet
        
        vm.stopPrank();
    }
    
    function test_WithdrawAsOwner() public {
        // First have someone buy tokens
        vm.startPrank(alice);
        uint256 amount = 5;
        uint256 cost = token.getCurrentPrice(amount);
        token.buyTokens{value: cost}(amount);
        vm.stopPrank();
        
        // Owner withdraws
        uint256 initialBalance = address(this).balance;
        token.withdraw();
        
        assertEq(address(token).balance, 0);
        assertEq(address(this).balance, initialBalance + cost);
    }
    
    function test_RevertWithdrawAsNonOwner() public {
        vm.startPrank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        token.withdraw();
        vm.stopPrank();
    }
    
    function test_PriceIncrease() public {
        uint256 initialPrice = token.getCurrentPrice(1);
        
        // Buy some tokens to increase supply
        vm.startPrank(alice);
        token.buyTokens{value: 1 ether}(5);
        vm.stopPrank();
        
        uint256 newPrice = token.getCurrentPrice(1);
        assertTrue(newPrice > initialPrice);
    }
    
    receive() external payable {} // Allow contract to receive ETH
}
