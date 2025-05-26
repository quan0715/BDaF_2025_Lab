# 固定兌換比例 Swap 合約

這是一個簡單的固定兌換比例代幣交換合約，支持兩種 ERC20 代幣之間的兌換。

## 📋 功能特性

- **固定兌換比例**: 1 TokenA = 3 TokenB
- **雙向兌換**: 支持 TokenA ↔ TokenB 互相兌換
- **流動性管理**: 合約擁有者可以添加/移除流動性
- **安全檢查**: 包含各種輸入驗證和餘額檢查
- **事件記錄**: 所有重要操作都會發出事件

## 🏗️ 合約架構

### 核心合約

- `FixedRateSwap.sol`: 主要的交換合約
- `TestTokenA.sol`: 測試用的 TokenA
- `TestTokenB.sol`: 測試用的 TokenB

### 兌換規則

- **TokenA → TokenB**: 1 TokenA = 3 TokenB
- **TokenB → TokenA**: 3 TokenB = 1 TokenA（TokenB 數量必須是 3 的倍數）

## 🚀 快速開始

### 1. 編譯合約

```bash
npx hardhat compile
```

### 2. 運行測試

```bash
npx hardhat test test/FixedRateSwap.test.ts
```

### 3. 啟動本地節點

```bash
npx hardhat node
```

### 4. 部署合約（在新終端中）

```bash
npx hardhat run scripts/deploy-swap.ts --network localhost
```

### 5. 運行演示

```bash
npx hardhat run scripts/interact-swap.ts --network localhost
```

## 📊 測試結果

所有測試都已通過：

- ✅ 部署測試（3/3）
- ✅ 流動性管理（3/3）
- ✅ TokenA 兌換 TokenB（3/3）
- ✅ TokenB 兌換 TokenA（3/3）
- ✅ 價格計算（3/3）
- ✅ 儲備查詢（1/1）
- ✅ 完整交易流程（1/1）

**總計：17 個測試全部通過**

## 🔧 主要函數

### 用戶函數

- `swapAToB(uint256 amountA)`: 將 TokenA 兌換為 TokenB
- `swapBToA(uint256 amountB)`: 將 TokenB 兌換為 TokenA（amountB 必須是 3 的倍數）
- `getAmountOut(uint256 amountIn, address tokenIn)`: 計算兌換後能得到的代幣數量
- `getReserves()`: 查看合約中的代幣儲備

### 管理員函數

- `addLiquidity(uint256 amountA, uint256 amountB)`: 添加流動性
- `removeLiquidity(uint256 amountA, uint256 amountB)`: 移除流動性

## 📝 使用示例

### JavaScript/TypeScript

```typescript
import { ethers } from "hardhat";

// 連接到合約
const swap = await ethers.getContractAt("FixedRateSwap", swapAddress);
const tokenA = await ethers.getContractAt("TestTokenA", tokenAAddress);

// 授權代幣
await tokenA.approve(swapAddress, ethers.parseEther("10"));

// 執行兌換
await swap.swapAToB(ethers.parseEther("10")); // 兌換 10 TokenA 得到 30 TokenB
```

### Solidity

```solidity
// 授權
tokenA.approve(swapAddress, 10 ether);

// 兌換
swap.swapAToB(10 ether); // 得到 30 ether TokenB
```

## ⚠️ 注意事項

1. **授權要求**: 在兌換前必須先授權合約使用您的代幣
2. **餘額檢查**: 確保合約有足夠的目標代幣來完成兌換
3. **數量限制**: TokenB 兌換 TokenA 時，TokenB 數量必須是 3 的倍數
4. **流動性管理**: 只有合約擁有者可以管理流動性

## 🎯 演示結果

運行演示腳本的輸出示例：

```
🔄 測試 1: 兌換 10 TokenA -> TokenB
   預期獲得: 30.0 TokenB
✅ 兌換完成

🔄 測試 2: 兌換 60 TokenB -> TokenA
   預期獲得: 20.0 TokenA
✅ 兌換完成

❌ 測試 3: 嘗試兌換 100 TokenB（不是 3 的倍數）
✅ 按預期失敗: TokenB 數量必須是 3 的倍數
```

## 📁 文件結構

```
contracts/
├── FixedRateSwap.sol       # 主要交換合約
├── TestTokenA.sol          # 測試代幣 A
└── TestTokenB.sol          # 測試代幣 B

scripts/
├── deploy-swap.ts          # 部署腳本
└── interact-swap.ts        # 交互演示腳本

test/
└── FixedRateSwap.test.ts   # 完整測試套件
```

## 🔗 合約地址（本地測試網）

- **TokenA**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **TokenB**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **FixedRateSwap**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

## 🛠️ 技術細節

- **Solidity 版本**: ^0.8.0
- **OpenZeppelin**: 使用 ERC20 和 Ownable 標準
- **Hardhat**: 用於開發、測試和部署
- **TypeScript**: 完整的類型安全支持

---

這個 Swap 合約展示了去中心化交易的基本概念，並提供了完整的測試覆蓋和使用示例。
