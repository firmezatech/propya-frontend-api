// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// FMZ Bonus Token - ERC20 token for gamification rewards
contract FMZBonusToken is ERC20, Ownable {
    mapping(address => bool) public gamificationContracts;
    
    constructor() ERC20("FMZ Bonus Token", "FMZB") {}
    
    function addGamificationContract(address _contract) external onlyOwner {
        gamificationContracts[_contract] = true;
    }
    
    function removeGamificationContract(address _contract) external onlyOwner {
        gamificationContracts[_contract] = false;
    }
    
    function mint(address to, uint256 amount) external {
        require(gamificationContracts[msg.sender], "Only authorized contracts can mint");
        _mint(to, amount * 10**decimals());
    }
    
    function burn(address from, uint256 amount) external {
        require(gamificationContracts[msg.sender], "Only authorized contracts can burn");
        _burn(from, amount * 10**decimals());
    }
}

// Achievement NFTs - ERC721 for unique achievements
contract FMZAchievementNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    mapping(address => bool) public gamificationContracts;
    mapping(uint256 => string) public achievementTypes;
    mapping(address => mapping(string => bool)) public userAchievements;
    
    event AchievementUnlocked(address indexed user, uint256 tokenId, string achievementType);
    
    constructor() ERC721("FMZ Achievement", "FMZA") {}
    
    function addGamificationContract(address _contract) external onlyOwner {
        gamificationContracts[_contract] = true;
    }
    
    function mintAchievement(address to, string memory achievementType) external returns (uint256) {
        require(gamificationContracts[msg.sender], "Only authorized contracts can mint");
        require(!userAchievements[to][achievementType], "Achievement already unlocked");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        achievementTypes[newTokenId] = achievementType;
        userAchievements[to][achievementType] = true;
        
        emit AchievementUnlocked(to, newTokenId, achievementType);
        return newTokenId;
    }
    
    function hasAchievement(address user, string memory achievementType) external view returns (bool) {
        return userAchievements[user][achievementType];
    }
}

// Main Gamification Contract
contract FMZGamification is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    FMZBonusToken public bonusToken;
    FMZAchievementNFT public achievementNFT;
    
    // User data structure
    struct UserData {
        uint256 totalPoints;
        uint256 level;
        uint256 claimableTokens;
        uint256 dailyStreak;
        uint256 lastActivityTimestamp;
        uint256 monthlyPoints;
        bool isActive;
    }
    
    // Point transaction structure
    struct PointTransaction {
        address user;
        string action;
        uint256 points;
        uint256 timestamp;
        bytes32 metadata;
    }
    
    // Level system
    struct Level {
        string name;
        uint256 minPoints;
        uint256 tokenMultiplier; // multiplier for bonus tokens (in basis points, 10000 = 1x)
    }
    
    // Monthly challenges
    struct MonthlyChallenge {
        string name;
        string description;
        uint256 targetValue;
        uint256 reward;
        uint256 month;
        uint256 year;
        bool isActive;
    }
    
    mapping(address => UserData) public users;
    mapping(address => uint256[]) public userPointHistory;
    mapping(address => mapping(uint256 => uint256)) public userMonthlyChallengeProgress;
    mapping(address => bool) public authorizedContracts;
    
    PointTransaction[] public pointTransactions;
    Level[] public levels;
    MonthlyChallenge[] public monthlyChallenges;
    
    // Events
    event PointsAwarded(address indexed user, uint256 points, string action);
    event LevelUp(address indexed user, uint256 newLevel, string levelName);
    event TokensClaimed(address indexed user, uint256 amount);
    event DailyStreakUpdated(address indexed user, uint256 newStreak);
    event ChallengeCompleted(address indexed user, uint256 challengeId, uint256 reward);
    
    constructor(address _bonusToken, address _achievementNFT) {
        bonusToken = FMZBonusToken(_bonusToken);
        achievementNFT = FMZAchievementNFT(_achievementNFT);
        
        // Initialize levels
        levels.push(Level("Bronze", 0, 10000));      // 1x multiplier
        levels.push(Level("Prata", 1000, 12000));    // 1.2x multiplier
        levels.push(Level("Ouro", 5000, 15000));     // 1.5x multiplier
        levels.push(Level("Platina", 15000, 20000)); // 2x multiplier
        levels.push(Level("Diamante", 50000, 30000)); // 3x multiplier
    }
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    function addAuthorizedContract(address _contract) external onlyOwner {
        authorizedContracts[_contract] = true;
    }
    
    function removeAuthorizedContract(address _contract) external onlyOwner {
        authorizedContracts[_contract] = false;
    }
    
    // Award points to user
    function awardPoints(
        address user, 
        uint256 points, 
        string memory action,
        bytes32 metadata
    ) external onlyAuthorized {
        require(user != address(0), "Invalid user address");
        require(points > 0, "Points must be greater than 0");
        
        UserData storage userData = users[user];
        uint256 previousLevel = userData.level;
        
        userData.totalPoints += points;
        userData.monthlyPoints += points;
        userData.lastActivityTimestamp = block.timestamp;
        userData.isActive = true;
        
        // Calculate new level
        userData.level = calculateLevel(userData.totalPoints);
        
        // Record transaction
        pointTransactions.push(PointTransaction({
            user: user,
            action: action,
            points: points,
            timestamp: block.timestamp,
            metadata: metadata
        }));
        
        userPointHistory[user].push(pointTransactions.length - 1);
        
        // Update claimable tokens
        updateClaimableTokens(user);
        
        emit PointsAwarded(user, points, action);
        
        // Check for level up
        if (userData.level > previousLevel) {
            emit LevelUp(user, userData.level, levels[userData.level].name);
            
            // Award achievement for level up
            if (userData.level == 1) {
                achievementNFT.mintAchievement(user, "FIRST_LEVEL_UP");
            } else if (userData.level == 3) {
                achievementNFT.mintAchievement(user, "GOLD_LEVEL");
            } else if (userData.level == 5) {
                achievementNFT.mintAchievement(user, "DIAMOND_LEVEL");
            }
        }
    }
    
    // Calculate user level based on points
    function calculateLevel(uint256 points) public view returns (uint256) {
        for (uint256 i = levels.length; i > 0; i--) {
            if (points >= levels[i - 1].minPoints) {
                return i - 1;
            }
        }
        return 0;
    }
    
    // Update claimable tokens based on points and level
    function updateClaimableTokens(address user) internal {
        UserData storage userData = users[user];
        uint256 levelIndex = userData.level;
        
        if (levelIndex < levels.length) {
            uint256 multiplier = levels[levelIndex].tokenMultiplier;
            uint256 baseTokens = userData.totalPoints / 100; // 1 token per 100 points
            userData.claimableTokens = (baseTokens * multiplier) / 10000;
        }
    }
    
    // Claim bonus tokens
    function claimBonusTokens() external nonReentrant {
        UserData storage userData = users[msg.sender];
        require(userData.claimableTokens > 0, "No tokens to claim");
        
        uint256 tokensToMint = userData.claimableTokens;
        userData.claimableTokens = 0;
        
        bonusToken.mint(msg.sender, tokensToMint);
        emit TokensClaimed(msg.sender, tokensToMint);
        
        // Award bonus points for claiming
        userData.totalPoints += 100;
        emit PointsAwarded(msg.sender, 100, "TOKEN_CLAIM_BONUS");
    }
    
    // Update daily streak
    function updateDailyStreak(address user) external onlyAuthorized {
        UserData storage userData = users[user];
        uint256 daysSinceLastActivity = (block.timestamp - userData.lastActivityTimestamp) / 1 days;
        
        if (daysSinceLastActivity <= 1) {
            userData.dailyStreak += 1;
        } else {
            userData.dailyStreak = 1;
        }
        
        userData.lastActivityTimestamp = block.timestamp;
        
        // Award streak bonuses
        if (userData.dailyStreak == 7) {
            awardPoints(user, 50, "WEEKLY_STREAK", bytes32(0));
        } else if (userData.dailyStreak == 30) {
            awardPoints(user, 200, "MONTHLY_STREAK", bytes32(0));
            achievementNFT.mintAchievement(user, "MONTHLY_STREAK");
        }
        
        emit DailyStreakUpdated(user, userData.dailyStreak);
    }
    
    // Process rent payment (called by rent contract)
    function processRentPayment(
        address user,
        uint256 paymentAmount,
        bool isOnTime,
        uint256 propertyId
    ) external onlyAuthorized {
        uint256 basePoints = isOnTime ? 100 : 50;
        
        // Bonus points for larger payments
        if (paymentAmount > 2000 * 10**18) { // More than R$ 2000
            basePoints += 50;
        }
        
        bytes32 metadata = keccak256(abi.encodePacked(paymentAmount, propertyId));
        awardPoints(user, basePoints, "RENT_PAYMENT", metadata);
        
        // Check for first payment achievement
        if (userPointHistory[user].length == 1) {
            achievementNFT.mintAchievement(user, "FIRST_PAYMENT");
        }
        
        updateDailyStreak(user);
    }
    
    // Process token purchase (called by property contract)
    function processTokenPurchase(
        address user,
        uint256 tokenAmount,
        uint256 propertyId
    ) external onlyAuthorized {
        uint256 points = tokenAmount * 10; // 10 points per token
        
        bytes32 metadata = keccak256(abi.encodePacked(tokenAmount, propertyId));
        awardPoints(user, points, "TOKEN_PURCHASE", metadata);
        
        // Check for collector achievements
        if (tokenAmount >= 100) {
            achievementNFT.mintAchievement(user, "TOKEN_COLLECTOR");
        }
        
        if (tokenAmount >= 1000) {
            achievementNFT.mintAchievement(user, "TOKEN_WHALE");
        }
    }
    
    // Create monthly challenge
    function createMonthlyChallenge(
        string memory name,
        string memory description,
        uint256 targetValue,
        uint256 reward
    ) external onlyOwner {
        uint256 currentMonth = (block.timestamp / 30 days) % 12 + 1;
        uint256 currentYear = 1970 + (block.timestamp / 365 days);
        
        monthlyChallenges.push(MonthlyChallenge({
            name: name,
            description: description,
            targetValue: targetValue,
            reward: reward,
            month: currentMonth,
            year: currentYear,
            isActive: true
        }));
    }
    
    // Complete monthly challenge
    function completeMonthlyChallenge(address user, uint256 challengeId) external onlyAuthorized {
        require(challengeId < monthlyChallenges.length, "Invalid challenge");
        require(monthlyChallenges[challengeId].isActive, "Challenge not active");
        
        MonthlyChallenge storage challenge = monthlyChallenges[challengeId];
        require(userMonthlyChallengeProgress[user][challengeId] >= challenge.targetValue, "Target not reached");
        
        awardPoints(user, challenge.reward, "MONTHLY_CHALLENGE", bytes32(challengeId));
        achievementNFT.mintAchievement(user, string(abi.encodePacked("CHALLENGE_", challengeId)));
        
        emit ChallengeCompleted(user, challengeId, challenge.reward);
    }
    
    // Get user data
    function getUserData(address user) external view returns (
        uint256 totalPoints,
        uint256 level,
        string memory levelName,
        uint256 claimableTokens,
        uint256 dailyStreak,
        uint256 monthlyPoints
    ) {
        UserData memory userData = users[user];
        string memory currentLevelName = userData.level < levels.length ? levels[userData.level].name : "Unknown";
        
        return (
            userData.totalPoints,
            userData.level,
            currentLevelName,
            userData.claimableTokens,
            userData.dailyStreak,
            userData.monthlyPoints
        );
    }
    
    // Get user's point history
    function getUserPointHistory(address user, uint256 limit) external view returns (
        string[] memory actions,
        uint256[] memory points,
        uint256[] memory timestamps
    ) {
        uint256[] memory userHistory = userPointHistory[user];
        uint256 length = userHistory.length > limit ? limit : userHistory.length;
        
        actions = new string[](length);
        points = new uint256[](length);
        timestamps = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 txIndex = userHistory[userHistory.length - 1 - i]; // Get latest first
            PointTransaction memory transaction = pointTransactions[txIndex];
            
            actions[i] = transaction.action;
            points[i] = transaction.points;
            timestamps[i] = transaction.timestamp;
        }
    }
    
    // Get leaderboard (returns top users by points)
    function getLeaderboard(uint256 limit) external view returns (
        address[] memory users_,
        uint256[] memory points,
        uint256[] memory levels_
    ) {
        // Note: This is a simplified implementation
        // In production, you'd want to maintain a sorted list or use an off-chain indexer
        users_ = new address[](limit);
        points = new uint256[](limit);
        levels_ = new uint256[](limit);
        
        // This would need to be implemented with proper sorting
        // For now, returning empty arrays as this requires complex on-chain sorting
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        // Implement pause functionality if needed
    }
    
    function unpause() external onlyOwner {
        // Implement unpause functionality if needed
    }
    
    // Reset monthly points (called monthly by admin or automated system)
    function resetMonthlyPoints() external onlyOwner {
        // This would typically be called by a keeper or admin at the start of each month
        // Implementation would iterate through active users and reset monthlyPoints
    }
} 