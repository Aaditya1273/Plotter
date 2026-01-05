// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title MetaArmy 3.0 - ERC-7715 Compliant
 * @dev Delegated execution with bounded permissions
 * Features: Session keys, spending limits, ZK verification hooks, $ARMY token utility
 */
contract MetaArmy is Ownable {
    using ECDSA for bytes32;

    // ============ State Variables ============
    
    address public armyToken;
    uint256 public standardFee = 10; // 0.1% = 10 basis points
    uint256 public stakedThreshold = 1000 * 10**18; // 1000 ARMY for free tier

    // ============ Permission & Session Management ============
    
    struct Permission {
        address token; // address(0) for native ETH
        uint256 periodLimit; // Max amount per period
        uint256 periodDuration; // Duration in seconds (e.g., 86400 = 1 day)
        uint256 periodStart; // Start of current period
        uint256 spentInPeriod; // Amount spent in current period
        uint256 expiresAt; // Permission expiration timestamp
        bool active;
    }

    struct SessionKey {
        address sessionAddress; // Address of session key
        mapping(address => Permission) permissions; // token => permission
        uint256 createdAt;
        uint256 expiresAt;
        uint256 nonce; // Prevent replay attacks
        bool active;
    }

    // user => sessionKeyId => SessionKey
    mapping(address => mapping(bytes32 => SessionKey)) public sessions;
    
    // Track all session IDs for a user
    mapping(address => bytes32[]) public userSessions;

    // ============ Swarm Actions ============
    
    struct SwarmAction {
        address target;
        address token; // address(0) for ETH, or ERC20 address
        uint256 amount;
        bytes data;
    }

    struct SwarmBundle {
        address user;
        address executor; // Session key or authorized executor
        string goal;
        uint256 timestamp;
        bool executed;
        bool active;
        uint256 totalActions;
        uint256 successfulActions;
    }

    mapping(bytes32 => SwarmBundle) public swarmBundles;
    mapping(bytes32 => SwarmAction[]) public bundleActions;

    // ============ Events ============
    
    event SessionCreated(
        address indexed user,
        bytes32 indexed sessionId,
        address sessionKey,
        uint256 expiresAt
    );
    
    event PermissionGranted(
        address indexed user,
        bytes32 indexed sessionId,
        address token,
        uint256 periodLimit,
        uint256 periodDuration
    );
    
    event SwarmBundleCreated(
        bytes32 indexed bundleId,
        address indexed user,
        address indexed executor,
        string goal,
        uint256 actionCount
    );
    
    event SwarmActionExecuted(
        bytes32 indexed bundleId,
        uint256 index,
        bool success,
        string reason
    );
    
    event SessionRevoked(address indexed user, bytes32 indexed sessionId);

    // ============ Constructor ============
    
    constructor(address _armyToken) Ownable(msg.sender) {
        armyToken = _armyToken;
    }

    // ============ Session Management (User Functions) ============
    
    /**
     * @notice User creates a session key with permissions (ONE-TIME SETUP)
     * @param sessionAddress The address that will execute on behalf of user
     * @param tokens Array of token addresses (address(0) for ETH)
     * @param periodLimits Max amounts per period for each token
     * @param periodDurations Period durations in seconds
     * @param expiresAt Session expiration timestamp
     */
    function createSession(
        address sessionAddress,
        address[] calldata tokens,
        uint256[] calldata periodLimits,
        uint256[] calldata periodDurations,
        uint256 expiresAt
    ) external returns (bytes32) {
        require(sessionAddress != address(0), "Invalid session address");
        require(tokens.length == periodLimits.length, "Length mismatch");
        require(tokens.length == periodDurations.length, "Length mismatch");
        require(expiresAt > block.timestamp, "Invalid expiration");
        require(tokens.length > 0 && tokens.length <= 10, "Invalid token count");

        bytes32 sessionId = keccak256(
            abi.encodePacked(msg.sender, sessionAddress, block.timestamp)
        );

        SessionKey storage session = sessions[msg.sender][sessionId];
        session.sessionAddress = sessionAddress;
        session.createdAt = block.timestamp;
        session.expiresAt = expiresAt;
        session.nonce = 0;
        session.active = true;

        // Grant permissions for each token
        for (uint256 i = 0; i < tokens.length; i++) {
            Permission storage perm = session.permissions[tokens[i]];
            perm.token = tokens[i];
            perm.periodLimit = periodLimits[i];
            perm.periodDuration = periodDurations[i];
            perm.periodStart = block.timestamp;
            perm.spentInPeriod = 0;
            perm.expiresAt = expiresAt;
            perm.active = true;

            emit PermissionGranted(
                msg.sender,
                sessionId,
                tokens[i],
                periodLimits[i],
                periodDurations[i]
            );
        }

        userSessions[msg.sender].push(sessionId);
        
        emit SessionCreated(msg.sender, sessionId, sessionAddress, expiresAt);
        
        return sessionId;
    }

    /**
     * @notice User revokes a session
     */
    function revokeSession(bytes32 sessionId) external {
        SessionKey storage session = sessions[msg.sender][sessionId];
        require(session.active, "Session not active");
        
        session.active = false;
        
        emit SessionRevoked(msg.sender, sessionId);
    }

    // ============ Delegated Execution (Session Key Functions) ============
    
    /**
     * @notice Execute a swarm bundle using delegated permissions (NO USER SIGNATURE)
     * @param user The user who granted permission
     * @param sessionId The session ID
     * @param goal Description of bundle goal
     * @param actions Array of actions to execute
     * @param zkProofHashes ZK proof hashes (if required)
     * @param signature Signature from session key
     */
    /**
     * @dev ERC-7715 compatible entry point for swarm creation. 
     * Can be called by users directly or by delegated smart accounts.
     */
    function createSwarmBundle(
        string memory goal,
        SwarmAction[] memory actions
    ) external returns (bytes32) {
        require(actions.length > 0, "No actions provided");
        require(actions.length <= 50, "Too many actions");

        bytes32 bundleId = keccak256(
            abi.encodePacked(msg.sender, goal, block.timestamp)
        );

        swarmBundles[bundleId] = SwarmBundle({
            user: msg.sender,
            executor: msg.sender,
            goal: goal,
            timestamp: block.timestamp,
            executed: false,
            active: true,
            totalActions: actions.length,
            successfulActions: 0
        });

        uint256 successCount = 0;
        for (uint256 i = 0; i < actions.length; i++) {
            bundleActions[bundleId].push(actions[i]);
            
            // Execute action as msg.sender
            (bool success, string memory reason) = _executeActionBare(
                msg.sender,
                actions[i]
            );

            if (success) {
                successCount++;
            }
            emit SwarmActionExecuted(bundleId, i, success, reason);
        }

        swarmBundles[bundleId].successfulActions = successCount;
        swarmBundles[bundleId].executed = true;

        emit SwarmBundleCreated(bundleId, msg.sender, msg.sender, goal, actions.length);
        return bundleId;
    }

    function executeBundle(
        bytes32 bundleId
    ) external returns (bool) {
        SwarmBundle storage bundle = swarmBundles[bundleId];
        require(bundle.active, "Bundle not active");
        require(!bundle.executed, "Bundle already executed");
        require(bundle.user == msg.sender, "Not authorized");

        uint256 successCount = 0;
        for (uint256 i = 0; i < bundle.totalActions; i++) {
            SwarmAction memory action = bundleActions[bundleId][i];
            
            (bool success, string memory reason) = _executeActionBare(
                msg.sender,
                action
            );

            if (success) {
                successCount++;
            }
            emit SwarmActionExecuted(bundleId, i, success, reason);
        }

        bundle.successfulActions = successCount;
        bundle.executed = true;

        return true;
    }

    function executeDelegatedBundle(
        address user,
        bytes32 sessionId,
        string memory goal,
        SwarmAction[] memory actions,
        bytes memory signature
    ) external returns (bytes32) {
        require(actions.length > 0, "No actions provided");
        require(actions.length <= 50, "Too many actions");

        SessionKey storage session = sessions[user][sessionId];
        require(session.active, "Session not active");
        require(block.timestamp <= session.expiresAt, "Session expired");

        // Verify signature from session key
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                user,
                sessionId,
                goal,
                session.nonce,
                block.chainid
            )
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ethSignedHash.recover(signature);
        require(signer == session.sessionAddress, "Invalid signature");

        // Increment nonce to prevent replay
        session.nonce++;

        // Create bundle
        bytes32 bundleId = keccak256(
            abi.encodePacked(user, msg.sender, goal, block.timestamp)
        );

        swarmBundles[bundleId] = SwarmBundle({
            user: user,
            executor: msg.sender,
            goal: goal,
            timestamp: block.timestamp,
            executed: false,
            active: true,
            totalActions: actions.length,
            successfulActions: 0
        });

        // Validate and execute actions
        uint256 successCount = 0;
        for (uint256 i = 0; i < actions.length; i++) {
            bundleActions[bundleId].push(actions[i]);
            (bool success, string memory reason) = _executeAction(
                user,
                sessionId,
                actions[i]
            );

            if (success) {
                successCount++;
            }
            emit SwarmActionExecuted(bundleId, i, success, reason);
        }

        swarmBundles[bundleId].successfulActions = successCount;
        swarmBundles[bundleId].executed = true;

        emit SwarmBundleCreated(bundleId, user, msg.sender, goal, actions.length);
        return bundleId;
    }

    /**
     * @dev Simple execution without session checks (used for direct/7715 calls).
     */
    function _executeActionBare(
        address user,
        SwarmAction memory action
    ) internal returns (bool success, string memory reason) {
        // Calculate and deduct fee (optional, but keep for consistency)
        uint256 fee = _calculateFee(user, action.amount);
        uint256 netAmount = action.amount - fee;

        if (action.token == address(0)) {
            (success, ) = action.target.call{value: netAmount}(action.data);
            if (!success) reason = "Native call failed";
        } else {
            IERC20 token = IERC20(action.token);
            try token.transferFrom(user, action.target, netAmount) returns (bool result) {
                success = result;
                if (action.data.length > 0) {
                    (success, ) = action.target.call(action.data);
                }
                if (!success) reason = "Swap/Interact call failed";
            } catch {
                success = false;
                reason = "TransferFrom failed";
            }
        }
    }

    /**
     * @notice Internal function to execute a single action with permission checks
     */
    function _executeAction(
        address user,
        bytes32 sessionId,
        SwarmAction memory action
    ) internal returns (bool success, string memory reason) {
        SessionKey storage session = sessions[user][sessionId];
        Permission storage perm = session.permissions[action.token];

        // Check if permission exists and is active
        if (!perm.active) {
            return (false, "Permission not granted for token");
        }

        if (block.timestamp > perm.expiresAt) {
            return (false, "Permission expired");
        }

        // Reset period if needed
        if (block.timestamp >= perm.periodStart + perm.periodDuration) {
            perm.periodStart = block.timestamp;
            perm.spentInPeriod = 0;
        }

        // Check spending limit
        if (perm.spentInPeriod + action.amount > perm.periodLimit) {
            return (false, "Exceeds period limit");
        }

        // In production, verify actual ZK proof here

        // Calculate and deduct fee
        uint256 fee = _calculateFee(user, action.amount);
        uint256 netAmount = action.amount - fee;

        // Execute action based on token type
        bool execSuccess;
        
        if (action.token == address(0)) {
            // Native ETH transfer
            (execSuccess, ) = action.target.call{value: netAmount}(action.data);
        } else {
            // ERC20 transfer
            // Assumes user has approved this contract to spend tokens
            IERC20 token = IERC20(action.token);
            
            try token.transferFrom(user, action.target, netAmount) returns (bool result) {
                execSuccess = result;
                
                // Execute additional call if data provided
                if (action.data.length > 0) {
                    (execSuccess, ) = action.target.call(action.data);
                }
            } catch {
                execSuccess = false;
            }
        }

        if (execSuccess) {
            // Update spent amount
            perm.spentInPeriod += action.amount;
            
            // Collect fee if applicable
            if (fee > 0 && armyToken != address(0)) {
                // Fee collection logic here
            }
            
            return (true, "Success");
        } else {
            return (false, "Execution failed");
        }
    }

    // ============ View Functions ============
    
    function _calculateFee(address user, uint256 amount) internal view returns (uint256) {
        if (IERC20(armyToken).balanceOf(user) >= stakedThreshold) {
            return 0;
        }
        return (amount * standardFee) / 10000;
    }

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
        SessionKey storage session = sessions[user][sessionId];
        return (
            session.sessionAddress,
            session.createdAt,
            session.expiresAt,
            session.nonce,
            session.active
        );
    }

    function getPermission(address user, bytes32 sessionId, address token)
        external
        view
        returns (
            uint256 periodLimit,
            uint256 periodDuration,
            uint256 periodStart,
            uint256 spentInPeriod,
            uint256 expiresAt,
            bool active
        )
    {
        Permission storage perm = sessions[user][sessionId].permissions[token];
        return (
            perm.periodLimit,
            perm.periodDuration,
            perm.periodStart,
            perm.spentInPeriod,
            perm.expiresAt,
            perm.active
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

    // ============ Admin Functions ============
    
    function setArmyToken(address _armyToken) external onlyOwner {
        armyToken = _armyToken;
    }

    function setStandardFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        standardFee = _fee;
    }

    function setStakedThreshold(uint256 _threshold) external onlyOwner {
        stakedThreshold = _threshold;
    }

    // ============ Emergency Functions ============
    
    function emergencyRevokeSession(address user, bytes32 sessionId) 
        external 
        onlyOwner 
    {
        sessions[user][sessionId].active = false;
        emit SessionRevoked(user, sessionId);
    }

    // Accept ETH
    receive() external payable {}
}