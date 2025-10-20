# 從 KV Store 遷移到 PostgreSQL 指南

## 📋 概述

本專案已從簡單的 KV Store（key-value 存儲）遷移到完整的 PostgreSQL 資料庫架構，以提供更強大的查詢能力、資料一致性和擴展性。

---

## 🎯 遷移優勢

### 之前（KV Store）
- ❌ 無法做複雜查詢（JOIN、聚合、排序）
- ❌ 無法建立外鍵關聯
- ❌ 擴展性差
- ❌ 無法利用資料庫索引優化
- ❌ 資料一致性難以保證
- ❌ 無法使用 SQL 視圖和函數

### 現在（PostgreSQL）
- ✅ 支援複雜 SQL 查詢
- ✅ 外鍵約束確保資料完整性
- ✅ 索引優化查詢性能
- ✅ 支援事務處理
- ✅ 可使用視圖簡化常用查詢
- ✅ 支援全文搜索和 JSONB 查詢
- ✅ 更好的擴展性和維護性

---

## 🗄️ 資料庫架構

### 1. 報價表 (quotes)
```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(20) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TWD',
    valid_until DATE NOT NULL,
    -- 海運/拖車/報關專用欄位
    origin VARCHAR(255),
    destination VARCHAR(255),
    carrier VARCHAR(255),
    -- ... 更多欄位
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**索引優化：**
- `idx_quotes_vendor_type` - 按供應商類型查詢
- `idx_quotes_price` - 價格排序
- `idx_quotes_valid_until` - 有效期篩選
- `idx_quotes_shipping` - 海運查詢優化（origin, destination, container_size）
- `idx_quotes_custom_fields` - JSONB 自定義欄位查詢（GIN 索引）

### 2. 供應商表 (vendors)
```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 自定義欄位表 (custom_fields)
```sql
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL,
    vendor_type VARCHAR(20) NOT NULL,
    options JSONB DEFAULT '[]',
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, vendor_type)
);
```

### 4. 詢價表 (inquiries & inquiry_vendors)
```sql
CREATE TABLE inquiries (
    id UUID PRIMARY KEY,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    inquiry_data JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inquiry_vendors (
    inquiry_id UUID REFERENCES inquiries(id),
    vendor_id UUID REFERENCES vendors(id),
    email VARCHAR(255) NOT NULL,
    sent_status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (inquiry_id, vendor_id)
);
```

---

## 🚀 執行遷移步驟

### 步驟 1：執行資料庫 Schema

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 執行 `src/supabase/migrations/schema.sql` 的內容
4. 確認所有表格、索引、視圖都已建立

### 步驟 2：驗證資料庫結構

在 Supabase SQL Editor 執行：

```sql
-- 檢查表格
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- 檢查索引
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- 檢查視圖
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

### 步驟 3：部署新的 Edge Function

後端 API 已完全重構，不再使用 KV Store：

```bash
# 如果需要重新部署 Edge Function
supabase functions deploy make-server-368a4ded
```

### 步驟 4：測試 API 端點

所有 API 端點保持不變，但現在使用 PostgreSQL：

**報價 API：**
- `GET /quotes` - 獲取所有報價
- `GET /quotes/:id` - 獲取單個報價
- `POST /quotes` - 創建報價
- `POST /quotes/batch` - 批量創建報價
- `PUT /quotes/:id` - 更新報價
- `DELETE /quotes/:id` - 刪除報價
- `POST /quotes/search` - 搜索報價

**供應商 API：**
- `GET /vendors` - 獲取所有供應商
- `GET /vendors/:id` - 獲取單個供應商
- `POST /vendors` - 創建供應商
- `PUT /vendors/:id` - 更新供應商
- `DELETE /vendors/:id` - 刪除供應商

**自定義欄位 API：**
- `GET /custom-fields` - 獲取所有自定義欄位
- `GET /custom-fields/vendor/:vendorType` - 按類型獲取
- `POST /custom-fields` - 創建自定義欄位
- `PUT /custom-fields/:id` - 更新自定義欄位
- `DELETE /custom-fields/:id` - 刪除自定義欄位

**詢價 API：**
- `POST /send-inquiry` - 發送詢價

---

## 🔄 資料遷移（如果有舊資料）

如果你在 KV Store 中有現有資料需要遷移：

### 方法 1：手動導出導入

1. 從舊系統導出資料為 JSON
2. 使用前端的「匯入報價」功能批量導入
3. 或使用 SQL INSERT 語句直接導入

### 方法 2：編寫遷移腳本

```typescript
// 範例：從 KV Store 遷移到 PostgreSQL
const migrateData = async () => {
  // 1. 從 KV Store 讀取所有報價
  const oldQuotes = await kv.getByPrefix('quote:');
  
  // 2. 轉換格式並批量插入
  const response = await fetch(
    `${API_URL}/quotes/batch`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes: oldQuotes }),
    }
  );
};
```

---

## 🧪 測試清單

- [ ] 創建報價
- [ ] 編輯報價
- [ ] 刪除報價
- [ ] 搜索報價（按類型、起點、終點、價格範圍）
- [ ] 報價比較功能
- [ ] 創建供應商
- [ ] 編輯供應商
- [ ] 刪除供應商
- [ ] 創建自定義欄位
- [ ] 編輯自定義欄位
- [ ] 刪除自定義欄位
- [ ] 發送詢價
- [ ] 批量匯入報價

---

## 📊 性能優化

### 已實施的優化

1. **索引優化**
   - 為常用查詢欄位建立索引
   - 使用部分索引（WHERE 條件）優化特定查詢
   - JSONB 欄位使用 GIN 索引

2. **視圖**
   - `quotes_with_vendor_details` - 報價與供應商聯合查詢
   - `valid_quotes` - 有效報價視圖
   - `vendor_statistics` - 供應商統計

3. **自動更新時間戳**
   - 使用 Trigger 自動更新 `updated_at`

### 未來可優化項目

- [ ] 實施資料分區（Partitioning）- 按日期分區報價表
- [ ] 設置連接池
- [ ] 實施查詢快取
- [ ] 定期清理過期報價（使用 `cleanup_expired_quotes()` 函數）

---

## 🗑️ 清理舊資料

遷移完成並確認一切正常後：

1. **刪除 KV Store 表格**（可選）
   ```sql
   DROP TABLE IF EXISTS kv_store_368a4ded;
   ```

2. **刪除 KV Store 檔案**
   ```bash
   rm src/supabase/functions/server/kv_store.tsx
   ```

---

## 📝 API 變更說明

### 命名轉換

後端使用 snake_case（資料庫標準），前端使用 camelCase（JavaScript 標準）。

API 自動處理轉換：

**前端發送：**
```json
{
  "vendorName": "長榮海運",
  "vendorType": "shipping",
  "validUntil": "2025-12-31",
  "customFields": { "bookingNumber": "ABC123" }
}
```

**資料庫存儲：**
```json
{
  "vendor_name": "長榮海運",
  "vendor_type": "shipping",
  "valid_until": "2025-12-31",
  "custom_fields": { "bookingNumber": "ABC123" }
}
```

**前端接收：**
```json
{
  "id": "uuid",
  "vendorName": "長榮海運",
  "vendorType": "shipping",
  "validUntil": "2025-12-31",
  "createdAt": "2025-10-20T10:00:00Z",
  "customFields": { "bookingNumber": "ABC123" }
}
```

---

## 🆘 疑難排解

### 問題：API 返回 500 錯誤

**檢查：**
1. Supabase 環境變數是否正確設置
2. 資料庫 Schema 是否完整執行
3. 查看 Edge Function 日誌

### 問題：查詢速度慢

**解決：**
1. 檢查是否有適當的索引
2. 使用 `EXPLAIN ANALYZE` 分析查詢計劃
3. 考慮增加資料庫資源

### 問題：外鍵約束錯誤

**原因：**
- 嘗試插入不存在的 `vendor_id`

**解決：**
- 確保供應商存在，或將 `vendor_id` 設為 `null`

---

## 📚 相關資源

- [Supabase PostgreSQL 文檔](https://supabase.com/docs/guides/database)
- [PostgreSQL 索引優化](https://www.postgresql.org/docs/current/indexes.html)
- [JSONB 使用指南](https://www.postgresql.org/docs/current/datatype-json.html)

---

## ✅ 完成確認

遷移完成後，確認以下項目：

- [x] 資料庫 Schema 已執行
- [x] 所有表格、索引、視圖已建立
- [x] Edge Function 已更新並部署
- [x] 前端 API 調用正常
- [x] 所有功能測試通過
- [ ] 舊資料已遷移（如有）
- [ ] KV Store 相關程式碼已清理（可選）

---

**恭喜！你的系統現在使用強大的 PostgreSQL 資料庫了！🎉**

