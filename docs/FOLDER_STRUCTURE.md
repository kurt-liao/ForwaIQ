# 📁 ForwaIQ 資料夾結構說明

## 🎯 整理原則

專案採用**功能模組化**的資料夾結構，將相關的組件、頁面和工具函數按照功能分類組織。

---

## 📂 完整結構

```
src/
├── App.tsx                          # 主應用組件
├── main.tsx                         # 應用入口
│
├── components/                      # 組件目錄
│   ├── quotes/                      # 報價相關組件
│   │   ├── AddQuoteDialog.tsx       # 新增/編輯報價對話框
│   │   ├── QuoteList.tsx            # 報價列表
│   │   ├── QuoteFilters.tsx         # 報價篩選器
│   │   ├── ComparisonView.tsx       # 報價比較視圖
│   │   └── ImportDialog.tsx         # 批次匯入對話框
│   │
│   ├── vendors/                     # 供應商相關組件
│   │   ├── VendorDialog.tsx         # 新增/編輯供應商對話框
│   │   ├── VendorTable.tsx          # 供應商表格
│   │   └── VendorSelection.tsx      # 供應商選擇器（用於詢價）
│   │
│   ├── inquiry/                     # 詢價相關組件
│   │   └── InquiryForm.tsx          # 詢價表單
│   │
│   ├── custom-fields/               # 自定義欄位相關組件
│   │   └── CustomFieldDialog.tsx    # 自定義欄位對話框
│   │
│   ├── ui/                          # UI 基礎組件（Radix UI + shadcn/ui）
│   │   ├── button.tsx               # 按鈕
│   │   ├── input.tsx                # 輸入框
│   │   ├── dialog.tsx               # 對話框
│   │   ├── table.tsx                # 表格
│   │   ├── sonner.tsx               # Toast 通知
│   │   └── ...                      # 其他 UI 組件
│   │
│   ├── figma/                       # Figma 相關組件
│   │   └── ImageWithFallback.tsx    # 圖片回退組件
│   │
│   └── common/                      # 共用組件（預留）
│
├── pages/                           # 頁面組件
│   ├── DashboardPage.tsx            # 數據儀表板
│   ├── QuotesPage.tsx               # 報價管理頁面
│   ├── VendorsPage.tsx              # 供應商管理頁面
│   ├── InquiryPage.tsx              # 批次詢價頁面
│   ├── CustomFieldsPage.tsx         # 欄位設定頁面
│   └── ToastTestPage.tsx            # Toast 測試頁面（開發用）
│
├── utils/                           # 工具函數
│   ├── validation/                  # 驗證相關
│   │   └── formValidation.ts        # 表單驗證工具
│   │
│   ├── formatting/                  # 格式化相關（預留）
│   │
│   └── supabase/                    # Supabase 相關
│       └── info.tsx                 # Supabase 配置資訊
│
├── supabase/                        # Supabase 相關
│   ├── functions/                   # Edge Functions
│   │   └── server/
│   │       └── index.tsx            # 後端 API
│   │
│   └── migrations/                  # 資料庫遷移
│       └── schema_v2.sql            # 資料庫 Schema
│
├── styles/                          # 全域樣式
│   └── globals.css                  # 全域 CSS
│
└── guidelines/                      # 開發指南
    └── Guidelines.md                # 開發規範
```

---

## 🗂️ 分類說明

### 1. **components/** - 組件目錄

#### **quotes/** - 報價相關組件
所有與報價管理相關的組件：
- `AddQuoteDialog.tsx` - 新增/編輯報價的對話框
- `QuoteList.tsx` - 顯示報價列表
- `QuoteFilters.tsx` - 報價篩選功能
- `ComparisonView.tsx` - 報價比較視圖
- `ImportDialog.tsx` - CSV/Excel 批次匯入

**使用位置**: `QuotesPage.tsx`

#### **vendors/** - 供應商相關組件
所有與供應商管理相關的組件：
- `VendorDialog.tsx` - 新增/編輯供應商的對話框
- `VendorTable.tsx` - 供應商列表表格
- `VendorSelection.tsx` - 供應商選擇器（用於詢價功能）

**使用位置**: `VendorsPage.tsx`, `InquiryPage.tsx`

#### **inquiry/** - 詢價相關組件
所有與批次詢價相關的組件：
- `InquiryForm.tsx` - 詢價表單

**使用位置**: `InquiryPage.tsx`

#### **custom-fields/** - 自定義欄位相關組件
所有與自定義欄位管理相關的組件：
- `CustomFieldDialog.tsx` - 新增/編輯自定義欄位的對話框

**使用位置**: `CustomFieldsPage.tsx`

#### **ui/** - UI 基礎組件
基於 Radix UI 和 shadcn/ui 的基礎 UI 組件：
- 按鈕、輸入框、對話框、表格等
- 可在整個專案中重複使用
- 統一的設計系統

**使用位置**: 所有頁面和組件

#### **figma/** - Figma 相關組件
與 Figma 設計相關的特殊組件

#### **common/** - 共用組件（預留）
跨功能模組的共用組件

---

### 2. **pages/** - 頁面組件

所有頁面級別的組件：
- `DashboardPage.tsx` - 首頁儀表板
- `QuotesPage.tsx` - 報價管理
- `VendorsPage.tsx` - 供應商管理
- `InquiryPage.tsx` - 批次詢價
- `CustomFieldsPage.tsx` - 欄位設定
- `ToastTestPage.tsx` - Toast 測試（開發用）

---

### 3. **utils/** - 工具函數

#### **validation/** - 驗證相關
- `formValidation.ts` - HTML5 表單驗證工具

#### **formatting/** - 格式化相關（預留）
日期、金額、文字格式化工具

#### **supabase/** - Supabase 相關
- `info.tsx` - Supabase 專案配置

---

### 4. **supabase/** - Supabase 相關

#### **functions/** - Edge Functions
- `server/index.tsx` - 後端 API（Hono 框架）

#### **migrations/** - 資料庫遷移
- `schema_v2.sql` - 完整資料庫 Schema

---

## 📋 Import 路徑規範

### 從頁面引用組件

```typescript
// ✅ 正確：使用相對路徑
import { QuoteList } from '../components/quotes/QuoteList';
import { VendorDialog } from '../components/vendors/VendorDialog';
import { Button } from '../components/ui/button';
```

### 組件內部引用

```typescript
// ✅ 正確：quotes 組件引用 UI 組件
import { Button } from '../ui/button';
import type { Quote } from '../../App';

// ✅ 正確：vendors 組件引用 UI 組件
import { Input } from '../ui/input';
import type { Vendor } from '../../App';
```

### 引用工具函數

```typescript
// ✅ 正確：從組件引用工具函數
import { setupFormValidation } from '../../utils/validation/formValidation';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
```

---

## 🎯 組織原則

### 1. **按功能分類**
- 相關的組件放在同一個資料夾
- 例如：所有報價相關的組件都在 `components/quotes/`

### 2. **單一職責**
- 每個組件只負責一個功能模組
- 避免組件之間的緊密耦合

### 3. **可重用性**
- UI 基礎組件放在 `components/ui/`
- 可在任何地方重複使用

### 4. **清晰的層級**
```
頁面 (pages/)
  └─> 功能組件 (components/quotes/, vendors/, etc.)
      └─> UI 組件 (components/ui/)
```

---

## 📊 組件依賴關係

```
App.tsx
  │
  ├─> DashboardPage.tsx
  │
  ├─> QuotesPage.tsx
  │     ├─> QuoteList.tsx
  │     ├─> QuoteFilters.tsx
  │     ├─> ComparisonView.tsx
  │     ├─> AddQuoteDialog.tsx
  │     └─> ImportDialog.tsx
  │
  ├─> VendorsPage.tsx
  │     ├─> VendorTable.tsx
  │     └─> VendorDialog.tsx
  │
  ├─> InquiryPage.tsx
  │     ├─> InquiryForm.tsx
  │     └─> VendorSelection.tsx
  │
  └─> CustomFieldsPage.tsx
        └─> CustomFieldDialog.tsx
```

---

## 🔄 遷移記錄

### 之前的結構（扁平化）
```
components/
├── AddQuoteDialog.tsx
├── QuoteList.tsx
├── QuoteFilters.tsx
├── ComparisonView.tsx
├── ImportDialog.tsx
├── VendorDialog.tsx
├── VendorTable.tsx
├── VendorSelection.tsx
├── InquiryForm.tsx
├── CustomFieldDialog.tsx
└── ui/
```

### 現在的結構（模組化）
```
components/
├── quotes/
│   ├── AddQuoteDialog.tsx
│   ├── QuoteList.tsx
│   ├── QuoteFilters.tsx
│   ├── ComparisonView.tsx
│   └── ImportDialog.tsx
├── vendors/
│   ├── VendorDialog.tsx
│   ├── VendorTable.tsx
│   └── VendorSelection.tsx
├── inquiry/
│   └── InquiryForm.tsx
├── custom-fields/
│   └── CustomFieldDialog.tsx
└── ui/
```

---

## ✨ 優勢

### 1. **更好的可維護性**
- 相關組件集中管理
- 容易找到需要修改的檔案

### 2. **清晰的模組邊界**
- 每個功能模組獨立
- 減少組件之間的耦合

### 3. **易於擴展**
- 新增功能時創建新資料夾
- 不會影響現有結構

### 4. **團隊協作友好**
- 明確的檔案組織
- 減少合併衝突

### 5. **符合最佳實踐**
- 遵循 React 社群標準
- 與大型專案結構一致

---

## 📝 命名規範

### 資料夾命名
- 使用小寫 + 連字符：`custom-fields/`, `inquiry/`
- 複數形式用於集合：`quotes/`, `vendors/`, `utils/`

### 檔案命名
- 組件使用 PascalCase：`QuoteList.tsx`, `VendorDialog.tsx`
- 工具函數使用 camelCase：`formValidation.ts`
- 頁面使用 PascalCase + Page 後綴：`QuotesPage.tsx`

---

## 🔗 相關文檔

- [開發規範](.cursorrules)
- [API 文檔](./API_REFERENCE.md)
- [Toast 使用指南](./TOAST_USAGE.md)

---

**保持資料夾結構清晰，讓專案更易維護！** 📁✨

