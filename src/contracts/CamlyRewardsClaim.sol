// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CamlyRewardsClaim
 * @notice Contract cho phép user rút số dư CAMLY đã kiếm được trong app ra ví thật
 * @dev Backend sẽ ký xác nhận số dư, user gửi signature lên contract để claim
 * 
 * CAMLY Token Address: 0x0910320181889feFDE0BB1Ca63962b0A8882e413
 * Chain: BSC Mainnet (Chain ID: 56)
 */
contract CamlyRewardsClaim is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable camlyToken;
    address public signer; // Backend signer address
    
    // Track claimed amounts per user to prevent double-claiming
    mapping(address => uint256) public claimedAmount;
    
    // Track used nonces to prevent replay attacks
    mapping(bytes32 => bool) public usedNonces;
    
    uint256 public totalClaimed;
    uint256 public totalClaimers;
    
    event RewardsClaimed(address indexed user, uint256 amount, uint256 totalClaimed);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event TokensDeposited(address indexed depositor, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    /**
     * @notice Constructor
     * @param _camlyToken Địa chỉ CAMLY token (0x0910320181889feFDE0BB1Ca63962b0A8882e413)
     * @param _signer Địa chỉ ví signer (backend sẽ dùng private key của ví này để ký)
     */
    constructor(address _camlyToken, address _signer) Ownable(msg.sender) {
        require(_camlyToken != address(0), "Invalid token address");
        require(_signer != address(0), "Invalid signer address");
        camlyToken = IERC20(_camlyToken);
        signer = _signer;
    }
    
    /**
     * @notice Claim rewards với backend signature
     * @param amount Số lượng claim (in wei, 18 decimals)
     * @param nonce Nonce duy nhất để chống replay attack
     * @param signature Chữ ký từ backend
     */
    function claimRewards(
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(!usedNonces[nonce], "Nonce already used");
        require(remainingPool() >= amount, "Insufficient pool balance");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            nonce,
            block.chainid,
            address(this)
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        
        require(recoveredSigner == signer, "Invalid signature");
        
        // Mark nonce as used
        usedNonces[nonce] = true;
        
        // Update state
        if (claimedAmount[msg.sender] == 0) {
            totalClaimers += 1;
        }
        claimedAmount[msg.sender] += amount;
        totalClaimed += amount;
        
        // Transfer tokens
        require(camlyToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, amount, claimedAmount[msg.sender]);
    }
    
    /**
     * @notice Lấy số token còn lại trong pool
     */
    function remainingPool() public view returns (uint256) {
        return camlyToken.balanceOf(address(this));
    }
    
    /**
     * @notice Cập nhật địa chỉ signer (chỉ owner)
     */
    function setSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer");
        emit SignerUpdated(signer, _newSigner);
        signer = _newSigner;
    }
    
    /**
     * @notice Rút token còn lại (chỉ owner)
     */
    function withdrawRemaining(address to) external onlyOwner {
        uint256 balance = remainingPool();
        require(balance > 0, "No balance");
        require(camlyToken.transfer(to, balance), "Transfer failed");
        emit TokensWithdrawn(to, balance);
    }
    
    /**
     * @notice Kiểm tra nonce đã được sử dụng chưa
     */
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }
}
