# CAMLY Rewards Claim Contract - Rút số dư CAMLY trong ứng dụng

## Mô tả
Contract này cho phép user rút số dư CAMLY đã kiếm được trong app ra ví thật. Backend sẽ ký xác nhận số dư, user gửi signature lên contract để claim.

## Contract Address của CAMLY Token
```
0x0910320181889feFDE0BB1Ca63962b0A8882e413
```

## Bước 1: Mở Remix IDE
Truy cập: https://remix.ethereum.org

## Bước 2: Tạo file `CamlyRewardsClaim.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    
    constructor(address _camlyToken, address _signer) Ownable(msg.sender) {
        require(_camlyToken != address(0), "Invalid token address");
        require(_signer != address(0), "Invalid signer address");
        camlyToken = IERC20(_camlyToken);
        signer = _signer;
    }
    
    /**
     * @notice Claim rewards with backend signature
     * @param amount Amount to claim (in wei, 18 decimals)
     * @param nonce Unique nonce to prevent replay
     * @param signature Backend signature
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
     * @notice Get remaining token pool
     */
    function remainingPool() public view returns (uint256) {
        return camlyToken.balanceOf(address(this));
    }
    
    /**
     * @notice Update signer address (owner only)
     */
    function setSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer");
        emit SignerUpdated(signer, _newSigner);
        signer = _newSigner;
    }
    
    /**
     * @notice Withdraw remaining tokens (owner only)
     */
    function withdrawRemaining(address to) external onlyOwner {
        uint256 balance = remainingPool();
        require(balance > 0, "No balance");
        require(camlyToken.transfer(to, balance), "Transfer failed");
        emit TokensWithdrawn(to, balance);
    }
    
    /**
     * @notice Check if nonce is used
     */
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }
}
```

## Bước 3: Compile
1. Chọn Solidity compiler version **0.8.20**
2. Bật optimization (200 runs)
3. Click "Compile CamlyRewardsClaim.sol"

## Bước 4: Deploy lên BSC Mainnet
1. Chọn **"Injected Provider - MetaMask"**
2. Đảm bảo MetaMask đang ở **BSC Mainnet** (Chain ID 56)
3. Trong phần Deploy:
   - `_camlyToken`: `0x0910320181889feFDE0BB1Ca63962b0A8882e413`
   - `_signer`: **Địa chỉ ví signer** (sẽ dùng để ký từ backend)
4. Click **"Deploy"**
5. Confirm transaction trong MetaMask (~0.01 BNB gas)

## Bước 5: Nạp CAMLY vào Rewards Pool
1. Mở MetaMask
2. Chọn token CAMLY
3. Send CAMLY đến địa chỉ Contract vừa deploy
4. Số lượng khuyến nghị: **100,000,000 CAMLY** (100 triệu)

## Bước 6: Tạo Signer Wallet
1. Tạo một ví mới trong MetaMask (chỉ dùng để ký, không cần BNB)
2. Lưu **Private Key** của ví này
3. Thêm vào Supabase Secrets với tên: `REWARDS_SIGNER_PRIVATE_KEY`

## Bước 7: Cập nhật Frontend
Sau khi deploy, gửi:
- **Địa chỉ Rewards Claim Contract**
- **Private Key của Signer** (để thêm vào secrets)

## Lưu ý bảo mật:
- **Signer wallet** chỉ dùng để ký, không cần nạp BNB
- **Private key** được lưu an toàn trong Supabase Secrets
- Mỗi claim cần **nonce duy nhất** để chống replay attack
- Backend verify số dư trước khi ký

## Flow hoạt động:
1. User bấm "Rút về ví" 
2. Frontend gọi Edge Function với (wallet_address, amount)
3. Edge Function verify số dư trong DB → ký signature
4. Frontend gọi smart contract với signature
5. Contract verify → transfer CAMLY → cập nhật DB

## Chi phí gas:
- Claim: ~0.003-0.005 BNB
- User cần BNB để trả gas
