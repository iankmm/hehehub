// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {HeheMeme} from "../src/HeheMeme.sol";

contract HeheMemeTest is Test {
    HeheMeme public heheMeme;
    address public user = address(0x1);
    string public constant TEST_MEME_URL = "https://example.com/meme.jpg";

    function setUp() public {
        heheMeme = new HeheMeme();
        vm.deal(user, 1 ether);
    }

    function test_MintMeme() public {
        vm.startPrank(user);
        
        // Test initial state
        assertEq(heheMeme.balanceOf(user), 0);

        // Mint a meme
        uint256 tokenId = heheMeme.mintMeme(TEST_MEME_URL);
        
        // Verify minting results
        assertEq(heheMeme.balanceOf(user), 1);
        assertEq(heheMeme.ownerOf(tokenId), user);
        assertEq(heheMeme.getMemeUrl(tokenId), TEST_MEME_URL);

        vm.stopPrank();
    }

    function test_MintMultipleMemes() public {
        vm.startPrank(user);
        
        string[] memory memeUrls = new string[](3);
        memeUrls[0] = "https://example.com/meme1.jpg";
        memeUrls[1] = "https://example.com/meme2.jpg";
        memeUrls[2] = "https://example.com/meme3.jpg";

        for (uint i = 0; i < memeUrls.length; i++) {
            uint256 tokenId = heheMeme.mintMeme(memeUrls[i]);
            assertEq(heheMeme.balanceOf(user), i + 1);
            assertEq(heheMeme.ownerOf(tokenId), user);
            assertEq(heheMeme.getMemeUrl(tokenId), memeUrls[i]);
        }

        vm.stopPrank();
    }

    function test_MintSameMemeMultipleTimes() public {
        vm.startPrank(user);
        
        // Mint the same meme multiple times
        uint256 firstTokenId = heheMeme.mintMeme(TEST_MEME_URL);
        uint256 secondTokenId = heheMeme.mintMeme(TEST_MEME_URL);
        
        // Verify each mint was successful
        assertEq(heheMeme.balanceOf(user), 2);
        assertEq(heheMeme.getMemeUrl(firstTokenId), TEST_MEME_URL);
        assertEq(heheMeme.getMemeUrl(secondTokenId), TEST_MEME_URL);
        assertEq(heheMeme.ownerOf(firstTokenId), user);
        assertEq(heheMeme.ownerOf(secondTokenId), user);

        vm.stopPrank();
    }

    function test_MintEmptyUrl() public {
        vm.startPrank(user);
        vm.expectRevert("URL cannot be empty");
        heheMeme.mintMeme("");
        vm.stopPrank();
    }

    function test_GetNonexistentMemeUrl() public {
        vm.expectRevert("Token does not exist");
        heheMeme.getMemeUrl(999);
    }
}
