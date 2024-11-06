// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MyToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFactory is Ownable {
    constructor(
        address _katanaRouter,
        address _wronAddress
    ) Ownable(msg.sender) {
        katanaRouter = _katanaRouter;
        wronAddress = _wronAddress;
    }
    
    mapping(string => address) public deployedTokens;
    uint256 public deploymentFee = 0.1 ether;
    address public katanaRouter;
    address public wronAddress;

    function setDeploymentFee(uint256 _newFee) external onlyOwner {
        deploymentFee = _newFee;
    }

    event TokenDeployed(string name, string symbol, address tokenAddress);
    function deployTokenV2(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external payable returns (address) {
        require(msg.value >= deploymentFee, "Insufficient payment");
        require(deployedTokens[symbol] == address(0), "Token symbol already exists");
        require(initialSupply >= 100000 && initialSupply <= 1000000000, "Initial supply must be between 100,000 and 1,000,000,000");
        MyToken tokenImplementation = new MyToken(
            name,
            symbol,
            katanaRouter,
            wronAddress,
            initialSupply,
            owner(),
            msg.sender
        );
        
        deployedTokens[symbol] = address(tokenImplementation);
        emit TokenDeployed(name, symbol, address(tokenImplementation));
        
        return address(tokenImplementation);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getTokenAddresses(string[] memory symbols) external view returns (address[] memory) {
        require(symbols.length <= 20, "Can only query up to 20 symbols at a time");
        address[] memory addresses = new address[](symbols.length);
        for (uint256 i = 0; i < symbols.length; i++) {
            addresses[i] = deployedTokens[symbols[i]];
        }
        return addresses;
    }
}