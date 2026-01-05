// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MetaArmyToken
 * @dev $ARMY - Utility and Governance token for MetaArmy 3.0
 * Features:
 * - ERC20 standard token
 * - ERC20Permit for gasless approvals
 * - ERC20Votes for on-chain governance
 * - Tiered utility benefits
 * - Staking integration hooks
 */
contract MetaArmyToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    // ============ Constants ============
    
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 10M tokens
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M max supply cap
    
    // ============ Utility Tiers ============
    
    struct Tier {
        string name;
        uint256 threshold;
        uint256 feeDiscount; // Basis points (100 = 1%)
        bool unlimitedGas;
    }
    
    Tier[] public tiers;
    
    // ============ Staking & Rewards ============
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // Basis points per year (1% APY)
    
    // ============ Token Features ============
    
    bool public transfersEnabled = true;
    mapping(address => bool) public isExemptFromFees;
    mapping(address => bool) public isBlacklisted;
    
    // ============ Events ============
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TierUpdated(uint256 indexed tierId, string name, uint256 threshold);
    event TransfersToggled(bool enabled);
    event AddressBlacklisted(address indexed account, bool status);
    
    // ============ Constructor ============
    
    constructor() 
        ERC20("MetaArmy", "ARMY") 
        ERC20Permit("MetaArmy") 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Initialize utility tiers
        tiers.push(Tier("Bronze", 100 * 10**18, 0, false));        // 100 ARMY
        tiers.push(Tier("Silver", 1000 * 10**18, 2500, false));    // 1K ARMY, 25% discount
        tiers.push(Tier("Gold", 10000 * 10**18, 5000, false));     // 10K ARMY, 50% discount
        tiers.push(Tier("Platinum", 100000 * 10**18, 10000, true)); // 100K ARMY, 100% discount + unlimited
        
        isExemptFromFees[msg.sender] = true;
    }
    
    // ============ Staking Functions ============
    
    /**
     * @notice Stake ARMY tokens to earn rewards and unlock tiers
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim pending rewards before staking more
        if (stakes[msg.sender].amount > 0) {
            _claimRewards(msg.sender);
        }
        
        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].stakedAt = block.timestamp;
        stakes[msg.sender].lastRewardClaim = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Unstake ARMY tokens
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked");
        
        // Claim rewards before unstaking
        _claimRewards(msg.sender);
        
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @notice Claim staking rewards
     */
    function claimRewards() external {
        _claimRewards(msg.sender);
    }
    
    /**
     * @notice Internal function to calculate and distribute rewards
     */
    function _claimRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount == 0) return;
        
        uint256 timeStaked = block.timestamp - userStake.lastRewardClaim;
        uint256 rewards = (userStake.amount * rewardRate * timeStaked) / (365 days * 10000);
        
        if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(user, rewards);
            emit RewardsClaimed(user, rewards);
        }
        
        userStake.lastRewardClaim = block.timestamp;
    }
    
    /**
     * @notice Get pending rewards for a user
     */
    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - userStake.lastRewardClaim;
        return (userStake.amount * rewardRate * timeStaked) / (365 days * 10000);
    }
    
    // ============ Tier & Utility Functions ============
    
    /**
     * @notice Get user's current tier based on balance + staked amount
     */
    function getUserTier(address user) public view returns (uint256 tierId, Tier memory tier) {
        uint256 totalBalance = balanceOf(user) + stakes[user].amount;
        
        // Start from highest tier
        for (uint256 i = tiers.length; i > 0; i--) {
            if (totalBalance >= tiers[i - 1].threshold) {
                return (i - 1, tiers[i - 1]);
            }
        }
        
        // No tier qualified
        return (type(uint256).max, Tier("None", 0, 0, false));
    }
    
    /**
     * @notice Get fee discount for user based on tier
     */
    function getFeeDiscount(address user) external view returns (uint256) {
        (, Tier memory tier) = getUserTier(user);
        return tier.feeDiscount;
    }
    
    /**
     * @notice Check if user has unlimited gas tier
     */
    function hasUnlimitedGas(address user) external view returns (bool) {
        (, Tier memory tier) = getUserTier(user);
        return tier.unlimitedGas;
    }
    
    /**
     * @notice Update tier parameters (owner only)
     */
    function updateTier(
        uint256 tierId,
        string memory name,
        uint256 threshold,
        uint256 feeDiscount,
        bool unlimitedGas
    ) external onlyOwner {
        require(tierId < tiers.length, "Invalid tier");
        require(feeDiscount <= 10000, "Invalid discount");
        
        tiers[tierId] = Tier(name, threshold, feeDiscount, unlimitedGas);
        
        emit TierUpdated(tierId, name, threshold);
    }
    
    /**
     * @notice Add new tier
     */
    function addTier(
        string memory name,
        uint256 threshold,
        uint256 feeDiscount,
        bool unlimitedGas
    ) external onlyOwner {
        require(feeDiscount <= 10000, "Invalid discount");
        
        tiers.push(Tier(name, threshold, feeDiscount, unlimitedGas));
        
        emit TierUpdated(tiers.length - 1, name, threshold);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Mint new tokens (capped at MAX_SUPPLY)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @notice Toggle transfers on/off (emergency only)
     */
    function toggleTransfers(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }
    
    /**
     * @notice Blacklist/unblacklist address
     */
    function setBlacklist(address account, bool status) external onlyOwner {
        isBlacklisted[account] = status;
        emit AddressBlacklisted(account, status);
    }
    
    /**
     * @notice Set fee exemption status
     */
    function setFeeExemption(address account, bool status) external onlyOwner {
        isExemptFromFees[account] = status;
    }
    
    /**
     * @notice Update reward rate (basis points per year)
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 10000, "Rate too high"); // Max 100% APY
        rewardRate = newRate;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get total balance (wallet + staked) for user
     */
    function getTotalBalance(address user) external view returns (uint256) {
        return balanceOf(user) + stakes[user].amount;
    }
    
    /**
     * @notice Get all tiers
     */
    function getTiers() external view returns (Tier[] memory) {
        return tiers;
    }
    
    /**
     * @notice Get staking info for user
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 lastRewardClaim,
        uint256 pendingRewards
    ) {
        StakeInfo storage userStake = stakes[user];
        
        uint256 pending = 0;
        if (userStake.amount > 0) {
            uint256 timeStaked = block.timestamp - userStake.lastRewardClaim;
            pending = (userStake.amount * rewardRate * timeStaked) / (365 days * 10000);
        }
        
        return (
            userStake.amount,
            userStake.stakedAt,
            userStake.lastRewardClaim,
            pending
        );
    }
    
    // ============ Overrides ============
    
    /**
     * @notice Override transfer to add blacklist and transfer toggle checks
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        // Allow minting/burning
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
            require(!isBlacklisted[from] && !isBlacklisted[to], "Address blacklisted");
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @notice Override nonces for ERC20Permit
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}