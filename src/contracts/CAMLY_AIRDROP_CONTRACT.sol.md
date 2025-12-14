# CAMLY Airdrop Contract - Phân phối token CAMLY có sẵn

## Contract Address của CAMLY Token
```
0x0910320181889feFDE0BB1Ca63962b0A8882e413
```

## Bước 1: Mở Remix IDE
Truy cập: https://remix.ethereum.org

## Bước 2: Tạo file `CamlyAirdrop.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract CamlyAirdrop {
    address public owner;
    IERC20 public camlyToken;
    
    uint256 public constant AIRDROP_AMOUNT = 50000 * 10**18; // 50,000 CAMLY
    mapping(address => bool) public hasClaimed;
    
    uint256 public totalClaimed;
    uint256 public totalClaimers;
    
    event AirdropClaimed(address indexed recipient, uint256 amount);
    event TokensDeposited(address indexed depositor, uint256 amount);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _camlyToken) {
        owner = msg.sender;
        camlyToken = IERC20(_camlyToken);
    }
    
    // Users claim their airdrop (one time only)
    function claimAirdrop() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(remainingAirdropPool() >= AIRDROP_AMOUNT, "Airdrop pool exhausted");
        
        hasClaimed[msg.sender] = true;
        totalClaimed += AIRDROP_AMOUNT;
        totalClaimers += 1;
        
        require(camlyToken.transfer(msg.sender, AIRDROP_AMOUNT), "Transfer failed");
        
        emit AirdropClaimed(msg.sender, AIRDROP_AMOUNT);
    }
    
    // Check if address has claimed
    function hasClaimedAirdrop(address account) external view returns (bool) {
        return hasClaimed[account];
    }
    
    // Get remaining airdrop pool
    function remainingAirdropPool() public view returns (uint256) {
        return camlyToken.balanceOf(address(this));
    }
    
    // Owner can withdraw remaining tokens
    function withdrawRemaining(address to) external onlyOwner {
        uint256 balance = camlyToken.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(camlyToken.transfer(to, balance), "Transfer failed");
        emit TokensWithdrawn(to, balance);
    }
    
    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
```

## Bước 3: Compile
1. Chọn Solidity compiler version **0.8.20**
2. Bật optimization (200 runs)
3. Click "Compile CamlyAirdrop.sol"

## Bước 4: Deploy lên BSC Mainnet
1. Chọn **"Injected Provider - MetaMask"**
2. Đảm bảo MetaMask đang ở **BSC Mainnet** (Chain ID 56)
3. Trong phần Deploy:
   - Nhập `_camlyToken`: `0x0910320181889feFDE0BB1Ca63962b0A8882e413`
4. Click **"Deploy"**
5. Confirm transaction trong MetaMask (~0.01 BNB gas)

## Bước 5: Nạp CAMLY vào Airdrop Contract
Sau khi deploy, bạn cần **transfer CAMLY** từ ví của bạn vào địa chỉ Airdrop Contract:

1. Mở MetaMask
2. Chọn token CAMLY
3. Send CAMLY đến địa chỉ Airdrop Contract vừa deploy
4. Số lượng khuyến nghị: **500,000,000 CAMLY** (500 triệu) để 10,000 người claim

## Bước 6: Cập nhật Frontend
Sau khi deploy và nạp token, gửi cho bố **địa chỉ Airdrop Contract mới** để cập nhật vào `src/lib/web3.ts`

## Verify Contract (Optional)
1. Vào BscScan: https://bscscan.com
2. Tìm Airdrop contract address
3. Click "Verify and Publish"
4. Chọn Solidity 0.8.20, Optimization: Yes, 200 runs
5. Paste source code
6. Constructor Arguments: `0x0910320181889feFDE0BB1Ca63962b0A8882e413`

## Lưu ý quan trọng:
- **Chi phí gas claim**: ~0.001-0.003 BNB mỗi lần claim
- **Người dùng cần BNB**: User phải có BNB để trả gas
- **One-time claim**: Mỗi địa chỉ chỉ claim được 1 lần
- **Pool balance**: Kiểm tra contract còn đủ CAMLY trước khi promote

## Test trên BSC Testnet trước (khuyến nghị):
1. Deploy lên Testnet trước để test
2. BSC Testnet RPC: https://data-seed-prebsc-1-s1.binance.org:8545
3. Chain ID: 97
4. Faucet: https://testnet.bnbchain.org/faucet-smart
