// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MetaArmy Simple - Working Version
 * @dev Simplified version focused on basic functionality
 */
contract MetaArmySimple is Ownable, ReentrancyGuard {
    
    // ============ Events ============
    
    event SessionCreated(
        address indexed user,
        bytes32 indexed sessionId,
        address sessionKey
    );
    
    event SwarmBundleCreated(
        bytes32 indexed bundleId,
        address indexed user,
        string goal,
        uint256 actionCount
    );
    
    event SwarmActionExecuted(
        bytes32 indexed bundleId,
        uint256 index,
        bool success,
        address target,
        uint256 amount
    );

    // ============ Structs ============
    
    struct SwarmAction {
        address target;
        address token; // address(0) for ETH
        uint256 amount;
        bytes data;
    }

    struct SwarmBundle {
        address user;
        string goal;
        uint256 timestamp;
        bool executed;
        uint256 totalActions;
        uint256 successfulActions;
    }

    // ============ State Variables ============
    
    mapping(bytes32 => SwarmBundle) public swarmBundles;
    mapping(bytes32 => SwarmAction[]) public bundleActions;
    mapping(address => bytes32[]) public userSessions;
    
    // Simple session tracking
    mapping(address => mapping(bytes32 => bool)) public activeSessions;

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}

    // ============ Main Functions ============
    
    /**
     * @notice Create a simple session (for compatibility)
     */
    function createSession(
        address sessionAddress,
        address[] calldata tokens,
        uint256[] calldata periodLimits,
        uint256[] calldata periodDurations,
        uint256 expiresAt
    ) external returns (bytes32) {
        bytes32 sessionId = keccak256(
            abi.encodePacked(msg.sender, sessionAddress, block.timestamp)
        );
        
        activeSessions[msg.sender][sessionId] = true;
        userSessions[msg.sender].push(sessionId);
        
        emit SessionCreated(msg.sender, sessionId, sessionAddress);
        return sessionId;
    }

    /**
     * @notice Create and execute a swarm bundle (SIMPLIFIED)
     * @param goal Description of what we're doing
     * @param actions Array of actions to execute
     */
    function createSwarmBundle(
        string memory goal,
        SwarmAction[] memory actions
    ) external payable nonReentrant returns (bytes32) {
        require(actions.length > 0, "No actions provided");
        require(actions.length <= 10, "Too many actions");

        bytes32 bundleId = keccak256(
            abi.encodePacked(msg.sender, goal, block.timestamp)
        );

        // Store bundle info
        swarmBundles[bundleId] = SwarmBundle({
            user: msg.sender,
            goal: goal,
            timestamp: block.timestamp,
            executed: false,
            totalActions: actions.length,
            successfulActions: 0
        });

        // Execute actions immediately
        uint256 successCount = 0;
        for (uint256 i = 0; i < actions.length; i++) {
            bundleActions[bundleId].push(actions[i]);
            
            bool success = _executeSimpleAction(actions[i]);
            if (success) {
                successCount++;
            }
            
            emit SwarmActionExecuted(bundleId, i, success, actions[i].target, actions[i].amount);
        }

        swarmBundles[bundleId].successfulActions = successCount;
        swarmBundles[bundleId].executed = true;

        emit SwarmBundleCreated(bundleId, msg.sender, goal, actions.length);
        return bundleId;
    }

    /**
     * @notice Execute a simple action (ETH transfer only for now)
     */
    function _executeSimpleAction(SwarmAction memory action) internal returns (bool) {
        if (action.token == address(0)) {
            // ETH transfer
            if (action.amount > 0) {
                (bool success, ) = action.target.call{value: action.amount}("");
                return success;
            }
            return true;
        } else {
            // ERC20 transfer (simplified - user must approve first)
            try IERC20(action.token).transferFrom(msg.sender, action.target, action.amount) {
                return true;
            } catch {
                return false;
            }
        }
    }

    // ============ View Functions ============
    
    function getSessionInfo(address user, bytes32 sessionId) 
        external 
        view 
        returns (
            address sessionAddress,
            uint256 createdAt,
            uint256 expiresAt,
            uint256 nonce,
            bool active
        ) 
    {
        return (
            address(0), // sessionAddress (simplified)
            block.timestamp, // createdAt
            block.timestamp + 30 days, // expiresAt
            0, // nonce
            activeSessions[user][sessionId] // active
        );
    }

    function getBundleActions(bytes32 bundleId) 
        external 
        view 
        returns (SwarmAction[] memory) 
    {
        return bundleActions[bundleId];
    }

    function getUserSessions(address user) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userSessions[user];
    }

    // ============ Utility Functions ============
    
    /**
     * @notice Simple ETH transfer function
     */
    function transferETH(address to, uint256 amount) external payable {
        require(msg.value >= amount, "Insufficient ETH sent");
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        // Refund excess
        if (msg.value > amount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - amount}("");
            require(refundSuccess, "Refund failed");
        }
    }

    // ============ Emergency Functions ============
    
    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    // Accept ETH
    receive() external payable {}
    fallback() external payable {}
}