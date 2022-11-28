// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {

    //* Price of one Crypto Dev token
    uint256 public constant tokenPrice = 0.001 ether;

    /* 
    * Each NFT would give the user 10 tokens
    * It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
    *  By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, 
    * having a balance of (1) is actually equal to (10 ^ -18) tokens.
    * Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
    * 
     */
    uint256 public constant tokensPerNFT = 10 * 10**18;

    // * the max total supply is 10000 for Crypto Dev Tokens
    uint256 public constant maxTotalSupply = 10000 * 10**18;

    // * Instance of ICryptoDevs
    ICryptoDevs CryptoDevsNFT;

    mapping(uint256 => bool) public claimedTokenIds;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 amount) public payable {
        // * the value of ehter that should be equal or greater than tokenPrice * amount
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Incorrect ether sent");

        uint256 amountWithDecimals = amount * 10**18;

        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply available"
        );

        // * Call the internal function from Openzeppelin's ERC20 contract
        _mint(msg.sender, amountWithDecimals);
    }

    /*
        * @Mints tokens based on the number of NFT's held by the sender
        * Requirements:
        * balance of Crypto Dev NFT's owned by the sender should be greater than 0
        * Tokens should have not been claimed for all the NFTs owned by the sender
    */
    function claim() public {
        address sender = msg.sender;

        // * Get the number of CryptoDev NFT's held by a given sender address
        uint256 balance = CryptoDevsNFT.balanceOf(sender);

        require(balance > 0, "You dont own any Crypto Dev NFT's");

        uint256 amount = 0; //* Amount keeps track of number of unclaimed tokenIds

        //* Loop over the balance and get the token ID owned by `sender` at a given `index` of its token list.
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);

            // * If the tokenId has not been claimed, increase the amount
            if(!claimedTokenIds[tokenId]) {
                amount += 1;
                claimedTokenIds[tokenId] = true;
            }
        }

        require(amount > 0, "You have already claimed all the tokens");

        _mint(msg.sender, amount * tokensPerNFT);
    }

    /* 
    *  withdraws all ETH and tokens sent to the contract
    * Requirements: wallet connected must be owner's address
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ehter");
    }


    receive() external payable {}

    fallback() external payable {}
}