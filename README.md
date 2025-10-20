# ForwaIQ

一個專為貨運代理業設計的報價管理系統，支援海運、拖車、報關等多種業務類型。

原始設計：https://www.figma.com/design/TRJ5MeWhWLsX71s46TyB7O/ForwaIQ

---

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 設置資料庫
請參考 [docs/QUICK_START.md](./docs/QUICK_START.md) 設置 Supabase 資料庫。

### 3. 測試 API
```bash
# 設定環境變數
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# 執行測試腳本
./tests/test-api.sh
```

詳細測試說明請參考 [tests/README.md](./tests/README.md)

### 4. 啟動開發伺服器
```bash
npm run dev
```

---

## 📚 文檔

完整文檔請查看 **[docs/](./docs/)** 資料夾：

### 快速開始
- **[快速啟動指南](./docs/QUICK_START.md)** - 3 步驟設置資料庫
- **[快速參考](./docs/QUICK_REFERENCE.md)** - API 和查詢速查表
- **[測試腳本](./tests/)** - ⚡ API 測試工具

### API 文檔
- **[API 參考](./docs/API_REFERENCE.md)** - 完整 API 文檔
- **[API 測試](./docs/API_TESTING.md)** - 詳細測試指南
- **[API 變更](./docs/API_CHANGES.md)** - API 變更說明

### 資料庫
- **[資料庫架構](./docs/DATABASE_ARCHITECTURE.md)** - 完整架構說明
- **[架構對照](./docs/SCHEMA_COMPARISON.md)** - 新舊架構對比
- **[遷移指南](./docs/MIGRATION_GUIDE.md)** - 遷移說明

---

## 🏗️ 技術架構

### 前端
- **React 18** + **TypeScript 5**
- **Vite 6** (使用 SWC)
- **Tailwind CSS** + **Radix UI**
- **React Hook Form**

### 後端
- **Supabase** (PostgreSQL + Edge Functions)
- **Hono** (API 框架)

### 資料庫
- **PostgreSQL** (9 個資料表)
- **20+ 個索引**（效能優化）
- **4 個視圖**（簡化查詢）
- **3 個實用函數**
- **7 個自動觸發器**

---

## 📁 專案結構

```
ForwaIQ/
├── src/
│   ├── components/          # React 組件
│   ├── pages/               # 頁面組件
│   ├── utils/               # 工具函數
│   └── supabase/
│       ├── migrations/      # 資料庫 Schema
│       └── functions/       # Edge Functions (API)
├── tests/                   # 🧪 測試腳本
│   ├── test-api.sh         # 完整 API 測試
│   └── test-vendor-id.sh   # 供應商 ID 測試
├── docs/                    # 📚 完整文檔
└── .cursorrules            # 開發規範
```

---

## 🎯 主要功能

### 1. 報價管理 (QuotesPage)
- 新增/編輯/刪除報價
- 多條件搜尋和篩選
- 報價比較功能
- Excel 批次匯入

### 2. 供應商管理 (VendorsPage)
- 供應商資料管理
- 多個聯絡人管理
- 供應商評分
- 按類型篩選（海運/拖車/報關）

### 3. 批次詢價 (InquiryPage)
- 一次向多個供應商發送詢價
- 自動生成詢價單號
- 追蹤發送狀態

### 4. 自定義欄位 (CustomFieldsPage)
- 動態新增業務欄位
- 支援多種欄位類型
- 按供應商類型分類

### 5. 數據儀表板 (DashboardPage)
- 報價統計
- 供應商統計
- 快速概覽

---

## 🔧 開發規範

請參考 [.cursorrules](./.cursorrules) 了解完整的開發規範，包括：
- TypeScript 規範
- React 組件規範
- 命名規範
- 函數撰寫規範
- 錯誤處理
- 效能優化

---

## 📊 資料庫

### 核心資料表
- `users` - 用戶
- `vendors` - 供應商
- `vendor_contacts` - 聯絡人
- `inquiries` - 詢價
- `quotes` - 報價
- `quote_line_items` - 報價明細
- `fee_types` - 費用類型
- `custom_fields` - 自定義欄位
- `inquiry_vendors` - 詢價-供應商關聯

詳細說明請參考 [docs/DATABASE_ARCHITECTURE.md](./docs/DATABASE_ARCHITECTURE.md)

---

## 🛠️ 開發指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 程式碼檢查
npm run lint
```

---

## 📝 授權

本專案為私有專案。

---

## 🆘 需要幫助？

1. 查看 [docs/](./docs/) 資料夾中的完整文檔
2. 參考 [.cursorrules](./.cursorrules) 開發規範
3. 查看 [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) 快速參考

---

**開始使用你的智慧報價管理系統！** 🚀
