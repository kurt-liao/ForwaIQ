# 🚀 ForwaIQ 資料庫快速啟動指南

## 立即執行（3 步驟）

### 步驟 1：執行 Schema
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點擊左側 **SQL Editor**
4. 點擊 **New Query**
5. 複製 `src/supabase/migrations/schema_v2.sql` 的完整內容
6. 貼上並點擊 **Run** 或按 `Cmd/Ctrl + Enter`

### 步驟 2：驗證安裝
在 SQL Editor 執行：

```sql
-- 檢查表格（應該看到 9 個表）
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 檢查範例資料
SELECT * FROM vendors;
SELECT * FROM vendor_contacts;
SELECT * FROM fee_types;
```

### 步驟 3：測試功能
前端應該已經可以正常使用了！測試：
- ✅ 新增供應商
- ✅ 新增報價
- ✅ 搜尋報價
- ✅ 批次詢價

---

## ✅ Schema 已修正的問題

### 問題：`type "vendor_type" already exists`
**已修正！** 現在使用：
```sql
DO $$ BEGIN
    CREATE TYPE vendor_type AS ENUM ('shipping', 'trucking', 'customs');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

### 特色：可重複執行
- ✅ 所有 `CREATE TABLE` 使用 `IF NOT EXISTS`
- ✅ 所有 `CREATE INDEX` 使用 `IF NOT EXISTS`
- ✅ 所有 `CREATE TYPE` 使用錯誤處理
- ✅ 範例資料使用 `ON CONFLICT DO NOTHING` 或條件插入
- ✅ 觸發器使用 `DROP IF EXISTS` 後再創建

**結果**：可以安全地重複執行 Schema，不會報錯！

---

## 📊 安裝後的資料庫結構

### 資料表（9 個）
1. ✅ `users` - 用戶表
2. ✅ `vendors` - 供應商表
3. ✅ `vendor_contacts` - 聯絡人表
4. ✅ `fee_types` - 費用類型表
5. ✅ `inquiries` - 詢價表
6. ✅ `inquiry_vendors` - 詢價-供應商關聯表（**新增**）
7. ✅ `quotes` - 報價表
8. ✅ `quote_line_items` - 報價明細表
9. ✅ `custom_fields` - 自定義欄位表

### 索引（20+ 個）
- 基礎索引：主鍵、外鍵、常用欄位
- 複合索引：針對海運/拖車查詢優化
- JSONB GIN 索引：快速 JSON 查詢

### 視圖（4 個）
1. `quotes_with_details` - 報價詳細資訊
2. `valid_quotes` - 有效報價
3. `vendor_statistics` - 供應商統計
4. `inquiry_statistics` - 詢價統計

### 函數（3 個）
1. `search_quotes()` - 智能搜尋報價
2. `cleanup_expired_quotes()` - 清理過期報價
3. `get_vendor_contacts_json()` - 取得聯絡人 JSON

### 觸發器（7 個）
- 自動更新 `updated_at`（6 個表）
- 自動生成 `inquiry_ref`
- 自動填入 `vendor_name`/`vendor_type`

### 範例資料
- 2 個用戶
- 7 個供應商（海運 3、拖車 2、報關 2）
- 2 個聯絡人
- 6 個費用類型

---

## 🔍 驗證清單

執行以下查詢確認安裝成功：

### 1. 檢查表格數量
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- 應該返回：9
```

### 2. 檢查索引數量
```sql
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public';
-- 應該返回：20+
```

### 3. 檢查視圖
```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
-- 應該看到：
-- inquiry_statistics
-- quotes_with_details
-- valid_quotes
-- vendor_statistics
```

### 4. 檢查範例供應商
```sql
SELECT 
    v.name,
    v.type,
    v.rating,
    COUNT(vc.contact_id) as contact_count
FROM vendors v
LEFT JOIN vendor_contacts vc ON v.vendor_id = vc.vendor_id
GROUP BY v.vendor_id, v.name, v.type, v.rating
ORDER BY v.name;
```

### 5. 測試視圖查詢
```sql
-- 測試供應商統計視圖
SELECT * FROM vendor_statistics;

-- 測試有效報價視圖（如果有報價資料）
SELECT * FROM valid_quotes LIMIT 5;
```

---

## 🎯 常見問題

### Q1: 執行 Schema 時遇到其他錯誤怎麼辦？
**A:** 如果遇到「表格已存在」錯誤，這是正常的！Schema 設計為可重複執行。

### Q2: 如何清空資料庫重新開始？
**A:** 在 `schema_v2.sql` 開頭取消註解這些行：
```sql
-- DROP TABLE IF EXISTS quote_line_items CASCADE;
-- DROP TABLE IF EXISTS quotes CASCADE;
-- ... 等等
```

### Q3: 範例資料是否必要？
**A:** 不是必要的，但建議保留以便快速測試。如果不需要，可以刪除：
```sql
DELETE FROM vendor_contacts;
DELETE FROM vendors;
DELETE FROM users WHERE email LIKE '%@forwaiq.com';
DELETE FROM fee_types;
```

### Q4: 如何確認觸發器正常運作？
**A:** 測試更新：
```sql
-- 更新供應商
UPDATE vendors SET name = name WHERE vendor_id = 1;

-- 檢查 updated_at 是否自動更新
SELECT name, created_at, updated_at FROM vendors WHERE vendor_id = 1;
-- updated_at 應該是剛才的時間
```

### Q5: 詢價單號如何生成？
**A:** 自動生成！新增詢價時：
```sql
INSERT INTO inquiries (user_id, vendor_type, subject)
VALUES (1, 'shipping', '測試詢價')
RETURNING inquiry_id, inquiry_ref;

-- inquiry_ref 會自動生成：INQ20251020-0001
```

---

## 📚 下一步

### 1. 配置 API（已完成）
後端 API 已經重構完成（`src/supabase/functions/server/index.tsx`）

### 2. 測試前端功能
- Dashboard（數據儀表板）
- Quotes（報價管理）
- Vendors（供應商管理）
- Inquiry（批次詢價）
- Custom Fields（欄位設定）

### 3. 可選：清理舊資料
如果確認新架構運作正常，可以刪除：
```sql
-- 刪除 KV Store 表格
DROP TABLE IF EXISTS kv_store_368a4ded;
```

---

## 🎉 完成！

你的資料庫現在擁有：
- ✅ 完整的正規化架構
- ✅ 優化的索引策略
- ✅ 自動化觸發器
- ✅ 實用的視圖和函數
- ✅ 可重複執行的 Schema

**開始使用你的智慧報價管理系統吧！** 🚀

---

## 📖 參考文檔

- **`schema_v2.sql`** - 完整 SQL 腳本
- **`DATABASE_ARCHITECTURE.md`** - 詳細架構說明
- **`SCHEMA_COMPARISON.md`** - 新舊架構對照
- **`MIGRATION_GUIDE.md`** - 遷移指南

有問題？檢查這些文檔或查看 SQL Editor 的錯誤訊息！

