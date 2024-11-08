// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./lib/ReentrancyGuard.sol";

interface IUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

interface IWRON {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract InitialPoolSeeder is ReentrancyGuard {
    IERC20 public immutable token;
    IERC20 public immutable wron;
    IUniswapV2Router public immutable uniswapRouter;
    uint256 public constant WRON_THRESHOLD = 0.1 ether;
    uint256 public currentWronBalance;
    bool public poolSeeded;
    address public owner;
    mapping(address => uint256) public userContributions;
    mapping(address => bool) public hasUserClaimed;
    uint256 public totalContributions;
    bool public claimEnabled;
    uint256 public constant AIRDROP_PERCENTAGE = 65;
    uint256 public constant POOL_PERCENTAGE = 35;
    address public deployer;
    uint256 public uniqueContributorsCount;
    uint256 public totalTokensForAirdrop;

    event TokensDeposited(address indexed sender, uint256 tokenAmount, uint256 wronAmount);
    event PoolSeeded(uint256 amountA, uint256 amountB, uint256 liquidity);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyOwnerOrDeployer() {
        require(msg.sender == owner || msg.sender == deployer, "Caller is not the owner or deployer");
        _;
    }

    constructor(address _token, address _wron, address _uniswapRouter, address _owner, address _deployer) {
        token = IERC20(_token);
        wron = IERC20(_wron);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        owner = _owner;
        deployer = _deployer;
    }

    function remainingTokensNeeded() public view returns (uint256) {
        if (poolSeeded) return 0;
        if (currentWronBalance >= WRON_THRESHOLD) return 0;
        return WRON_THRESHOLD - currentWronBalance;
    }

    function depositTokens() public payable nonReentrant {
        require(!poolSeeded, "Pool already seeded");
        require(msg.value > 0, "Must send RON");
        
        uint256 remainingNeeded = WRON_THRESHOLD - currentWronBalance;
        require(msg.value <= remainingNeeded, "Amount exceeds remaining threshold needed");
        
        if (userContributions[msg.sender] == 0) {
            uniqueContributorsCount++;
        }

        IWRON(address(wron)).deposit{value: msg.value}();
        
        currentWronBalance += msg.value;
        userContributions[msg.sender] += msg.value;
        totalContributions += msg.value;

        emit TokensDeposited(msg.sender, 0, msg.value);
    }

    receive() external payable {}

    function seedLiquidityPool() external onlyOwnerOrDeployer {
        require(!poolSeeded, "Pool already seeded");
        require(!claimEnabled, "Claim already open");
        require(currentWronBalance >= WRON_THRESHOLD, "Insufficient WRON balance");

        uint256 totalTokenBalance = token.balanceOf(address(this));
        uint256 wronAmount = wron.balanceOf(address(this));

        totalTokensForAirdrop = (totalTokenBalance * AIRDROP_PERCENTAGE) / 100;
        uint256 tokenAAmount = (totalTokenBalance * POOL_PERCENTAGE) / 100;
        
        require(tokenAAmount > 0 && wronAmount > 0, "No tokens available");
        require(token.approve(address(uniswapRouter), tokenAAmount), "Token approval failed");
        require(wron.approve(address(uniswapRouter), wronAmount), "Token approval failed");

        uint256 deadline = block.timestamp + 20 minutes;

        (uint256 amountA, uint256 amountB, uint256 liquidity) = uniswapRouter.addLiquidity(
            address(token),
            address(wron),
            tokenAAmount,
            wronAmount,
            tokenAAmount,
            wronAmount,
            address(0x0000000000000000000000000000000000000000),
            deadline
        );

        require(amountA > 0 && amountB > 0 && liquidity > 0, "Liquidity addition failed");

        poolSeeded = true;
        emit PoolSeeded(amountA, amountB, liquidity);

        claimEnabled = true;
    }

    // function emergencyWithdraw() external onlyOwner {
    //     require(!poolSeeded, "Pool already seeded");
        
    //     uint256 tokenBalance = token.balanceOf(address(this));
    //     if (tokenBalance > 0) {
    //         token.transfer(owner, tokenBalance);
    //     }
        
    //     uint256 ronBalance = address(this).balance;
    //     if (ronBalance > 0) {
    //         payable(owner).transfer(ronBalance);
    //     }
    // }

    // Nouvelle fonction pour le claim des airdrops
    function claimAirdrop() external nonReentrant {
        require(claimEnabled, "Claiming not enabled yet");
        require(userContributions[msg.sender] > 0, "No contribution found");
        require(!hasUserClaimed[msg.sender], "Already claimed");

        uint256 userShare = (userContributions[msg.sender] * totalTokensForAirdrop) 
                           / totalContributions;
        
        hasUserClaimed[msg.sender] = true;
        token.transfer(msg.sender, userShare);
    }

    struct PoolInfo {
        uint256 uniqueContributorsCount;
        bool claimEnabled;
        uint256 totalContributions;
        address deployer;
        uint256 wronThreshold;
        uint256 remainingTokensNeeded;
    }

    function getPoolInfo() external view returns (PoolInfo memory) {
        return PoolInfo({
            uniqueContributorsCount: uniqueContributorsCount,
            claimEnabled: claimEnabled,
            totalContributions: totalContributions,
            deployer: deployer,
            wronThreshold: WRON_THRESHOLD,
            remainingTokensNeeded: remainingTokensNeeded()
        });
    }
}

contract MyToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    InitialPoolSeeder public poolSeeder;
    address public immutable KATANA_ROUTER;
    address public immutable WRON;

    event PoolSeederDeployed(address poolSeeder);

    constructor(
        string memory name,
        string memory symbol,
        address katanaRouter,
        address wronAddress,
        uint256 initialSupply,
        address owner,
        address externalDeployer
    ) ERC20(name, symbol) {
        KATANA_ROUTER = katanaRouter;
        WRON = wronAddress;

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MINTER_ROLE, owner);
        
        // Deploy PoolSeeder first
        poolSeeder = new InitialPoolSeeder(
            address(this),
            address(wronAddress),
            katanaRouter, 
            owner,
            externalDeployer      
        );

        _mint(address(poolSeeder), initialSupply * 10**18);
        
        emit PoolSeederDeployed(address(poolSeeder));
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function getPoolSeederAddress() public view returns (address) {
        return address(poolSeeder);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20) {
        super._update(from, to, value);
    }
}