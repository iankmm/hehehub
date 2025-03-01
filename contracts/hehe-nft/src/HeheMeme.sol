// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HeheMeme is ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    // Mapping from token ID to meme URL
    mapping(uint256 => string) private _memeUrls;
    
    event MemeMinted(uint256 indexed tokenId, address indexed minter, string memeUrl);

    constructor() ERC721("HeheMeme", "HEHE") {}

    function mintMeme(string memory memeUrl) public returns (uint256) {
        require(bytes(memeUrl).length > 0, "URL cannot be empty");
        
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _memeUrls[tokenId] = memeUrl;
        
        emit MemeMinted(tokenId, msg.sender, memeUrl);
        
        return tokenId;
    }

    function getMemeUrl(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _memeUrls[tokenId];
    }

    function isMemeUrlMinted(string memory memeUrl) public view returns (bool) {
        // Since we allow multiple mints of the same URL, this function
        // is kept for compatibility but will always return false
        return false;
    }

    // Override required function
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    // Override required function
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}