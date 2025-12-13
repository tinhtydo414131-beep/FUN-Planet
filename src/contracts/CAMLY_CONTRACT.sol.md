# CAMLY Token Contract - Deploy với Remix IDE

## Bước 1: Mở Remix IDE
Truy cập: https://remix.ethereum.org

## Bước 2: Tạo file contract mới
Tạo file `CamlyToken.sol` với code sau:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CamlyToken is ERC20, Ownable {
    uint256 public constant AIRDROP_AMOUNT = 50000 * 10**18; // 50,000 CAMLY
    mapping(address => bool) public hasClaimed;
    
    event AirdropClaimed(address indexed recipient, uint256 amount);
    event AirdropSent(address indexed recipient, uint256 amount);
    
    constructor() ERC20("Camly Coin", "CAMLY") Ownable(msg.sender) {
        // Mint 1 billion CAMLY to contract
        _mint(address(this), 1_000_000_000 * 10**18);
    }
    
    // Owner can airdrop to any address
    function airdrop(address to, uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _transfer(address(this), to, amount);
        emit AirdropSent(to, amount);
    }
    
    // Users can claim their airdrop (one time only)
    function claimAirdrop() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(balanceOf(address(this)) >= AIRDROP_AMOUNT, "Airdrop pool exhausted");
        
        hasClaimed[msg.sender] = true;
        _transfer(address(this), msg.sender, AIRDROP_AMOUNT);
        
        emit AirdropClaimed(msg.sender, AIRDROP_AMOUNT);
    }
    
    // Check if address has claimed
    function hasClaimedAirdrop(address account) external view returns (bool) {
        return hasClaimed[account];
    }
    
    // Get remaining airdrop pool
    function remainingAirdropPool() external view returns (uint256) {
        return balanceOf(address(this));
    }
    
    // Owner can withdraw remaining tokens
    function withdrawRemaining(address to) external onlyOwner {
        uint256 balance = balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        _transfer(address(this), to, balance);
    }
}
```

## Bước 3: Compile
1. Chọn Solidity compiler version 0.8.20
2. Bật optimization (200 runs)
3. Click "Compile CamlyToken.sol"

## Bước 4: Deploy lên BSC Mainnet
1. Chọn "Injected Provider - MetaMask"
2. Đảm bảo MetaMask đang ở BSC Mainnet (Chain ID 56)
3. Cần có BNB để trả gas (~0.01-0.02 BNB)
4. Click "Deploy"
5. Confirm transaction trong MetaMask

## Bước 5: Verify Contract (Optional)
1. Vào BscScan: https://bscscan.com
2. Tìm contract address
3. Click "Verify and Publish"
4. Chọn Solidity 0.8.20, Optimization: Yes, 200 runs
5. Paste source code

## Bước 6: Cập nhật Frontend
Sau khi deploy, copy contract address và cập nhật file `src/lib/web3.ts`:
```typescript
export const CAMLY_CONTRACT_ADDRESS = 'YOUR_NEW_CONTRACT_ADDRESS';
```

## Lưu ý quan trọng:
- **Chi phí gas**: Mỗi transaction claimAirdrop tốn ~0.001-0.003 BNB
- **Người dùng cần BNB**: Để claim, user phải có BNB trong ví để trả gas
- **One-time claim**: Mỗi địa chỉ chỉ claim được 1 lần
- **Contract balance**: Kiểm tra contract còn đủ CAMLY trước khi promote

## Test trên BSC Testnet trước:
- BSC Testnet RPC: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97
- Faucet: https://testnet.bnbchain.org/faucet-smart
