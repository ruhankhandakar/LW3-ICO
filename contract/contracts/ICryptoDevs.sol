// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICryptoDevs {
    /* 
        Returns a token ID owned by `owner` at a given `index` of its token list.
        Use along with {balanceOf} to enumerate all of ``owner``'s tokens.

        PS: these functions are actually ofr ERC721Enumerable contract
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);

    /* 
         Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);
}