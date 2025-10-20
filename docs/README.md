# 📚 ForwaIQ 文檔中心

歡迎來到 ForwaIQ 智慧報價管理系統的文檔中心！

---

## 🚀 快速開始

### 新手入門
- **[QUICK_START.md](./QUICK_START.md)** - 3 步驟快速啟動指南
  - 執行資料庫 Schema
  - 驗證安裝
  - 開始使用

### 快速參考
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 常用功能速查表
  - API 端點
  - 常用查詢
  - 快速操作

---

## 📊 資料庫與 API 文檔

### API 參考
- **[API_REFERENCE.md](./API_REFERENCE.md)** - 完整 API 文檔
  - 所有端點說明
  - 請求/回應格式
  - 資料型別定義
  - 使用範例
  - 錯誤處理

### UI 組件
- **[TOAST_USAGE.md](./TOAST_USAGE.md)** - Toast 通知使用指南
  - 顏色主題配置
  - 使用方法與範例
  - 進階功能
  - 最佳實踐

### 專案結構
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - 資料夾結構說明
  - 完整目錄結構
  - 分類說明
  - Import 路徑規範
  - 組織原則

### 架構說明
- **[DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)** - 完整資料庫架構文檔
  - 9 個資料表詳細說明
  - ER 關聯圖
  - 索引策略
  - 視圖和函數
  - 效能優化
  - UI 對應說明

### 架構對比
- **[SCHEMA_COMPARISON.md](./SCHEMA_COMPARISON.md)** - 新舊架構對照表
  - 欄位對照
  - 功能改進
  - 遷移建議

### 遷移指南
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - 從 KV Store 遷移到 PostgreSQL
  - 遷移優勢
  - 執行步驟
  - 疑難排解

---

## 📁 文檔結構

```
docs/
├── README.md                      # 本文件（文檔索引）
├── QUICK_START.md                 # 快速啟動指南
├── QUICK_REFERENCE.md             # 快速參考
├── API_REFERENCE.md               # API 完整文檔
├── TOAST_USAGE.md                 # Toast 通知使用指南
├── FOLDER_STRUCTURE.md            # 資料夾結構說明
├── DATABASE_ARCHITECTURE.md       # 資料庫架構說明
├── SCHEMA_COMPARISON.md           # 架構對照表
└── MIGRATION_GUIDE.md             # 遷移指南
```

---

## 🎯 依需求查找

### 我想要...

#### 🆕 第一次設置資料庫
→ 閱讀 [QUICK_START.md](./QUICK_START.md)

#### 📖 了解資料庫結構
→ 閱讀 [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)

#### 🔄 從舊架構遷移
→ 閱讀 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

#### 🆚 比較新舊架構差異
→ 閱讀 [SCHEMA_COMPARISON.md](./SCHEMA_COMPARISON.md)

#### ⚡ 快速查找 API 或查詢
→ 閱讀 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

#### 📡 查看 API 端點和使用方法
→ 閱讀 [API_REFERENCE.md](./API_REFERENCE.md)

#### 🎨 了解 Toast 通知的使用
→ 閱讀 [TOAST_USAGE.md](./TOAST_USAGE.md)

#### 📁 查看專案資料夾結構
→ 閱讀 [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)

---

## 🔗 相關資源

### 程式碼
- `src/supabase/migrations/schema_v2.sql` - 完整資料庫 Schema
- `src/supabase/functions/server/index.tsx` - 後端 API
- `.cursorrules` - 開發規範

### 專案文檔
- `README.md` - 專案主要說明（在根目錄）

---

## 💡 提示

- 所有文檔都使用 Markdown 格式
- 可以使用任何 Markdown 閱讀器查看
- 建議按照順序閱讀：QUICK_START → DATABASE_ARCHITECTURE → 其他

---

**需要幫助？** 查看對應的文檔或參考專案的 `.cursorrules` 開發規範！

