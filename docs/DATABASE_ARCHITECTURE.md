# 📊 ForwaIQ 資料庫架構說明

## 目錄
- [概覽](#概覽)
- [核心資料表](#核心資料表)
- [資料關聯](#資料關聯)
- [UI 對應](#ui-對應)
- [API 端點設計](#api-端點設計)
- [效能優化](#效能優化)

---

## 概覽

### 資料庫特色
- ✅ **8 個主要資料表**：覆蓋完整業務流程
- ✅ **3 個 ENUM 類型**：確保資料一致性
- ✅ **20+ 個索引**：優化查詢效能
- ✅ **4 個視圖**：簡化常用查詢
- ✅ **3 個實用函數**：業務邏輯封裝
- ✅ **7 個自動觸發器**：自動化欄位更新

### 架構設計原則
1. **正規化**：避免資料冗餘，保持資料一致性
2. **性能優化**：針對常用查詢建立索引
3. **彈性擴展**：使用 JSONB 存儲自定義欄位
4. **資料完整性**：外鍵約束確保關聯正確

---

## 核心資料表

### 1. users（用戶表）
**用途**：系統用戶管理

| 欄位 | 類型 | 說明 |
|------|------|------|
| user_id | SERIAL | 主鍵 |
| name | VARCHAR(255) | 用戶姓名 |
| email | VARCHAR(255) | Email（唯一） |
| password_hash | VARCHAR(255) | 密碼雜湊值 |
| role | user_role | 角色（admin/staff/viewer） |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**UI 對應**：
- 未來的登入系統
- 用戶權限管理

---

### 2. vendors（供應商表）
**用途**：供應商基本資訊

| 欄位 | 類型 | 說明 |
|------|------|------|
| vendor_id | SERIAL | 主鍵 |
| name | VARCHAR(255) | 供應商名稱 |
| type | vendor_type | 類型（shipping/trucking/customs） |
| address | TEXT | 地址 |
| main_phone | VARCHAR(50) | 主要電話 |
| rating | DECIMAL(2,1) | 評分（0.0-5.0） |
| notes | TEXT | 備註 |
| is_active | BOOLEAN | 是否啟用 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**索引**：
- `idx_vendors_type`：按類型查詢
- `idx_vendors_name`：按名稱查詢
- `idx_vendors_active`：篩選啟用狀態

**UI 對應**：
- `VendorsPage`：供應商管理頁面
- `VendorDialog`：新增/編輯供應商
- `VendorTable`：供應商列表

---

### 3. vendor_contacts（供應商聯絡人表）
**用途**：供應商聯絡人資訊（一對多）

| 欄位 | 類型 | 說明 |
|------|------|------|
| contact_id | SERIAL | 主鍵 |
| vendor_id | INTEGER | 供應商 ID（外鍵） |
| name | VARCHAR(255) | 聯絡人姓名 |
| title | VARCHAR(100) | 職稱 |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | 電話 |
| is_primary | BOOLEAN | 是否為主要聯絡人 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**索引**：
- `idx_vendor_contacts_vendor_id`：查詢特定供應商的聯絡人
- `idx_vendor_contacts_primary`：快速找到主要聯絡人

**UI 對應**：
```typescript
interface VendorContact {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}
```

**範例**：
```sql
-- 取得供應商的所有聯絡人
SELECT * FROM vendor_contacts 
WHERE vendor_id = 1 
ORDER BY is_primary DESC, name ASC;

-- 使用 JSON 函數（用於 API）
SELECT get_vendor_contacts_json(1);
```

---

### 4. inquiries（詢價表）
**用途**：記錄發送給供應商的詢價

| 欄位 | 類型 | 說明 |
|------|------|------|
| inquiry_id | SERIAL | 主鍵 |
| inquiry_ref | VARCHAR(50) | 詢價單號（自動生成，如 INQ20251020-0001） |
| user_id | INTEGER | 創建用戶（外鍵） |
| status | inquiry_status | 狀態（pending/quoted/accepted/rejected） |
| subject | VARCHAR(500) | 主旨 |
| vendor_type | vendor_type | 詢價類型 |
| origin_location | VARCHAR(255) | 起點 |
| destination_location | VARCHAR(255) | 終點 |
| container_size | VARCHAR(50) | 貨櫃尺寸 |
| cargo_type | VARCHAR(255) | 貨物類型 |
| pickup_location | VARCHAR(255) | 取貨地點 |
| delivery_location | VARCHAR(255) | 送貨地點 |
| customs_type | VARCHAR(100) | 報關類型 |
| product_category | VARCHAR(255) | 產品類別 |
| quantity | INTEGER | 數量 |
| target_date | DATE | 目標日期 |
| details | TEXT | 詳細說明 |
| custom_fields | JSONB | 自定義欄位 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**索引**：
- `idx_inquiries_user`：按用戶查詢
- `idx_inquiries_status`：按狀態篩選
- `idx_inquiries_vendor_type`：按類型篩選
- `idx_inquiries_created`：按時間排序
- `idx_inquiries_custom_fields`：JSONB 欄位查詢（GIN 索引）

**UI 對應**：
- `InquiryPage`：批次詢價頁面
- `InquiryForm`：詢價表單
- `VendorSelection`：選擇供應商

**自動生成詢價單號**：
```sql
-- 觸發器自動生成
-- 格式：INQ + YYYYMMDD + 流水號
-- 範例：INQ20251020-0001
```

---

### 5. inquiry_vendors（詢價-供應商關聯表）
**用途**：記錄詢價發送給哪些供應商（多對多）

| 欄位 | 類型 | 說明 |
|------|------|------|
| inquiry_id | INTEGER | 詢價 ID（外鍵，複合主鍵） |
| vendor_id | INTEGER | 供應商 ID（外鍵，複合主鍵） |
| email | VARCHAR(255) | 發送的 Email |
| sent_status | VARCHAR(20) | 發送狀態（pending/sent/failed） |
| sent_at | TIMESTAMP | 發送時間 |

**範例查詢**：
```sql
-- 查詢某個詢價發送給哪些供應商
SELECT 
    v.name AS vendor_name,
    iv.email,
    iv.sent_status,
    iv.sent_at
FROM inquiry_vendors iv
JOIN vendors v ON iv.vendor_id = v.vendor_id
WHERE iv.inquiry_id = 1;
```

---

### 6. quotes（報價表）
**用途**：儲存供應商的報價資料

| 欄位 | 類型 | 說明 |
|------|------|------|
| quote_id | SERIAL | 主鍵 |
| inquiry_id | INTEGER | 詢價 ID（外鍵） |
| vendor_id | INTEGER | 供應商 ID（外鍵） |
| vendor_name | VARCHAR(255) | 供應商名稱（冗餘，加速查詢） |
| vendor_type | vendor_type | 供應商類型（冗餘） |
| total_cost_display | DECIMAL(12,2) | 總價（顯示用） |
| base_currency | VARCHAR(10) | 幣別 |
| origin | VARCHAR(255) | 起點（海運） |
| destination | VARCHAR(255) | 終點（海運） |
| carrier | VARCHAR(255) | 承運商（海運） |
| transit_time | VARCHAR(100) | 運輸時間 |
| container_size | VARCHAR(50) | 貨櫃尺寸 |
| pickup_location | VARCHAR(255) | 取貨地點（拖車） |
| delivery_location | VARCHAR(255) | 送貨地點（拖車） |
| truck_type | VARCHAR(100) | 卡車類型（拖車） |
| customs_type | VARCHAR(100) | 報關類型（報關） |
| product_category | VARCHAR(255) | 產品類別（報關） |
| valid_until | DATE | 有效期限 |
| remarks | TEXT | 備註 |
| custom_fields | JSONB | 自定義欄位 |
| received_at | TIMESTAMP | 收到報價時間 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**索引優化**：
```sql
-- 基礎索引
CREATE INDEX idx_quotes_inquiry ON quotes(inquiry_id);
CREATE INDEX idx_quotes_vendor ON quotes(vendor_id);
CREATE INDEX idx_quotes_vendor_type ON quotes(vendor_type);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_quotes_total_cost ON quotes(total_cost_display);

-- 針對海運查詢的複合索引
CREATE INDEX idx_quotes_shipping 
ON quotes(vendor_type, origin, destination, container_size) 
WHERE vendor_type = 'shipping';

-- 針對拖車查詢的複合索引
CREATE INDEX idx_quotes_trucking 
ON quotes(vendor_type, pickup_location, delivery_location) 
WHERE vendor_type = 'trucking';

-- JSONB 欄位索引（GIN 索引）
CREATE INDEX idx_quotes_custom_fields 
ON quotes USING GIN (custom_fields);
```

**UI 對應**：
- `QuotesPage`：報價管理頁面
- `QuoteList`：報價列表
- `ComparisonView`：報價比較
- `AddQuoteDialog`：新增/編輯報價

**自動觸發器**：
```sql
-- 自動填入 vendor_name 和 vendor_type
-- 從 vendors 表自動抓取，確保資料一致
```

---

### 7. quote_line_items（報價明細表）
**用途**：報價費用拆分（一對多）

| 欄位 | 類型 | 說明 |
|------|------|------|
| item_id | SERIAL | 主鍵 |
| quote_id | INTEGER | 報價 ID（外鍵） |
| fee_type_id | INTEGER | 費用類型 ID（外鍵） |
| description_legacy | VARCHAR(255) | 舊版描述（建議用 fee_type） |
| cost | DECIMAL(12,2) | 費用 |
| currency | VARCHAR(10) | 幣別 |
| remarks | TEXT | 備註 |
| display_order | INTEGER | 顯示順序 |
| created_at | TIMESTAMP | 創建時間 |

**範例**：
```sql
-- 報價 #123 的費用明細
SELECT 
    ft.name AS fee_name,
    qli.cost,
    qli.currency,
    qli.remarks
FROM quote_line_items qli
LEFT JOIN fee_types ft ON qli.fee_type_id = ft.fee_type_id
WHERE qli.quote_id = 123
ORDER BY qli.display_order;
```

---

### 8. fee_types（費用類型表）
**用途**：標準化費用類型主檔

| 欄位 | 類型 | 說明 |
|------|------|------|
| fee_type_id | SERIAL | 主鍵 |
| name | VARCHAR(255) | 費用名稱（唯一） |
| category | VARCHAR(100) | 類別 |
| description | TEXT | 說明 |
| is_active | BOOLEAN | 是否啟用 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**預設費用類型**：
- 海運費
- THC（Terminal Handling Charge）
- 文件費
- 拖車費
- 報關費
- 查驗費

---

### 9. custom_fields（自定義欄位表）
**用途**：定義報價和詢價的自定義欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| name | VARCHAR(255) | 欄位名稱 |
| field_type | VARCHAR(20) | 欄位類型（text/number/select/date/textarea） |
| vendor_type | vendor_type | 供應商類型 |
| options | JSONB | 下拉選單選項 |
| is_required | BOOLEAN | 是否必填 |
| display_order | INTEGER | 顯示順序 |
| created_at | TIMESTAMP | 創建時間 |
| updated_at | TIMESTAMP | 更新時間 |

**唯一約束**：`(name, vendor_type)`

**UI 對應**：
- `CustomFieldsPage`：自定義欄位管理
- `CustomFieldDialog`：新增/編輯欄位

**範例**：
```sql
-- 為海運類型新增「船期」欄位
INSERT INTO custom_fields (name, field_type, vendor_type, is_required, display_order)
VALUES ('船期', 'date', 'shipping', false, 1);

-- 為報關類型新增「報關方式」下拉選單
INSERT INTO custom_fields (name, field_type, vendor_type, options, is_required, display_order)
VALUES (
    '報關方式', 
    'select', 
    'customs', 
    '["一般報關", "快速通關", "C3自主管理"]'::jsonb,
    false,
    1
);
```

---

## 資料關聯

### ER Diagram（關聯圖）

```
users (1) ──────┐
                │
                │ creates
                ▼
          inquiries (1)
                │
                ├─────┐ has_many
                │     ▼
                │   quotes (N)
                │     │
                │     │ has_many
                │     ▼
                │   quote_line_items (N)
                │     │
                │     │ references
                │     ▼
                │   fee_types
                │
                │ sent_to (M:N)
                ▼
          inquiry_vendors (M:N)
                │
                │ references
                ▼
          vendors (1)
                │
                │ has_many
                ▼
          vendor_contacts (N)

custom_fields (獨立表，用於動態欄位定義)
```

### 關聯說明

1. **users → inquiries**（一對多）
   - 一個用戶可以創建多個詢價

2. **inquiries → quotes**（一對多）
   - 一個詢價可以收到多個報價

3. **quotes → quote_line_items**（一對多）
   - 一個報價可以有多個費用明細

4. **inquiries ↔ vendors**（多對多，透過 inquiry_vendors）
   - 一個詢價可以發給多個供應商
   - 一個供應商可以收到多個詢價

5. **vendors → vendor_contacts**（一對多）
   - 一個供應商可以有多個聯絡人

6. **vendors → quotes**（一對多）
   - 一個供應商可以提供多個報價

7. **fee_types → quote_line_items**（一對多）
   - 一個費用類型可以被多個明細使用

---

## UI 對應

### 1. DashboardPage（數據儀表板）
**使用的視圖/函數**：
```sql
-- 統計資訊
SELECT COUNT(*) FROM quotes WHERE valid_until >= CURRENT_DATE;
SELECT COUNT(*) FROM vendors WHERE is_active = TRUE;
SELECT COUNT(*) FROM inquiries WHERE status = 'pending';

-- 使用視圖
SELECT * FROM inquiry_statistics ORDER BY created_at DESC LIMIT 5;
SELECT * FROM vendor_statistics ORDER BY total_quotes DESC LIMIT 5;
```

---

### 2. QuotesPage（報價管理）
**API 端點對應**：

#### GET /quotes（取得所有報價）
```sql
SELECT * FROM quotes ORDER BY received_at DESC;
```

#### POST /quotes（新增報價）
```sql
INSERT INTO quotes (
    inquiry_id, vendor_id, vendor_name, vendor_type,
    total_cost_display, base_currency, origin, destination,
    carrier, transit_time, container_size, valid_until, remarks
) VALUES (...);
```

#### PUT /quotes/:id（更新報價）
```sql
UPDATE quotes 
SET total_cost_display = $1, valid_until = $2, ...
WHERE quote_id = $3;
```

#### DELETE /quotes/:id（刪除報價）
```sql
DELETE FROM quotes WHERE quote_id = $1;
```

#### POST /quotes/search（搜尋報價）
```sql
-- 使用函數
SELECT * FROM search_quotes(
    p_vendor_type := 'shipping',
    p_origin := '基隆',
    p_destination := '寧波',
    p_min_price := 1000,
    p_max_price := 2000
);
```

---

### 3. VendorsPage（供應商管理）

#### GET /vendors（取得所有供應商）
```sql
SELECT 
    v.*,
    (
        SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', contact_id,
                'name', name,
                'title', title,
                'email', email,
                'phone', phone,
                'isPrimary', is_primary
            )
        )
        FROM vendor_contacts vc
        WHERE vc.vendor_id = v.vendor_id
    ) AS contacts
FROM vendors v
ORDER BY v.name ASC;
```

#### POST /vendors（新增供應商）
```sql
-- 1. 插入供應商
INSERT INTO vendors (name, type, address, main_phone, rating, notes)
VALUES (...) RETURNING vendor_id;

-- 2. 插入聯絡人
INSERT INTO vendor_contacts (vendor_id, name, title, email, phone, is_primary)
VALUES (...);
```

---

### 4. InquiryPage（批次詢價）

#### POST /send-inquiry（發送詢價）
```sql
-- 1. 創建詢價
INSERT INTO inquiries (
    user_id, vendor_type, subject, origin_location, 
    destination_location, container_size, details
) VALUES (...) RETURNING inquiry_id;

-- 2. 記錄發送給哪些供應商
INSERT INTO inquiry_vendors (inquiry_id, vendor_id, email, sent_status, sent_at)
VALUES (...);
```

---

### 5. CustomFieldsPage（欄位設定）

#### GET /custom-fields（取得所有自定義欄位）
```sql
SELECT * FROM custom_fields 
ORDER BY vendor_type ASC, display_order ASC;
```

#### GET /custom-fields/vendor/:vendorType（按類型取得）
```sql
SELECT * FROM custom_fields 
WHERE vendor_type = $1
ORDER BY display_order ASC;
```

---

## 效能優化

### 1. 索引策略

#### 基礎索引
```sql
-- 主鍵索引（自動建立）
-- 外鍵索引
CREATE INDEX idx_quotes_inquiry ON quotes(inquiry_id);
CREATE INDEX idx_quotes_vendor ON quotes(vendor_id);

-- 常用查詢欄位
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_quotes_vendor_type ON quotes(vendor_type);
```

#### 複合索引（針對特定查詢）
```sql
-- 海運報價查詢（類型 + 起點 + 終點 + 貨櫃）
CREATE INDEX idx_quotes_shipping 
ON quotes(vendor_type, origin, destination, container_size) 
WHERE vendor_type = 'shipping';

-- 拖車報價查詢（類型 + 取貨 + 送貨）
CREATE INDEX idx_quotes_trucking 
ON quotes(vendor_type, pickup_location, delivery_location) 
WHERE vendor_type = 'trucking';
```

#### JSONB 索引
```sql
-- GIN 索引用於 JSONB 欄位
CREATE INDEX idx_quotes_custom_fields 
ON quotes USING GIN (custom_fields);

-- 查詢範例
SELECT * FROM quotes 
WHERE custom_fields @> '{"bookingNumber": "ABC123"}';
```

---

### 2. 視圖使用

#### quotes_with_details（報價詳細資訊）
```sql
-- 不需要寫複雜的 JOIN，直接查詢視圖
SELECT * FROM quotes_with_details 
WHERE vendor_type = 'shipping'
ORDER BY total_cost_display ASC;
```

#### vendor_statistics（供應商統計）
```sql
-- 快速取得供應商統計資訊
SELECT * FROM vendor_statistics 
WHERE type = 'shipping'
ORDER BY avg_quote_amount DESC;
```

---

### 3. 函數使用

#### search_quotes（智能搜尋）
```sql
-- 使用函數進行複雜搜尋
SELECT * FROM search_quotes(
    p_vendor_type := 'shipping',
    p_origin := '基隆',
    p_destination := '寧波',
    p_container_size := '40HQ',
    p_min_price := 1000,
    p_max_price := 2000,
    p_search_term := '長榮'
);
```

#### cleanup_expired_quotes（定期清理）
```sql
-- 手動執行或設定 Cron Job
SELECT cleanup_expired_quotes(90); -- 清理 90 天前過期的報價
```

---

## 資料流程範例

### 完整詢價到報價流程

```sql
-- 1. 用戶創建詢價
INSERT INTO inquiries (
    user_id, vendor_type, subject, 
    origin_location, destination_location,
    container_size, target_date, details
) VALUES (
    1, 'shipping', '台灣到寧波 40HQ 詢價',
    '基隆港', '寧波港',
    '40HQ', '2025-11-01', '急件，請盡快報價'
) RETURNING inquiry_id;
-- 假設返回 inquiry_id = 100

-- 2. 選擇要發送詢價的供應商（取得海運供應商）
SELECT vendor_id, name, main_phone
FROM vendors
WHERE type = 'shipping' AND is_active = TRUE;

-- 3. 記錄發送給哪些供應商
INSERT INTO inquiry_vendors (inquiry_id, vendor_id, email, sent_status, sent_at)
VALUES 
    (100, 1, 'wang@evergreen.com', 'sent', NOW()),
    (100, 2, 'lee@yangming.com', 'sent', NOW()),
    (100, 3, 'contact@wanhai.com', 'sent', NOW());

-- 4. 供應商回覆報價（透過 UI 或 Email）
INSERT INTO quotes (
    inquiry_id, vendor_id, vendor_name, vendor_type,
    origin, destination, carrier, transit_time,
    container_size, total_cost_display, base_currency,
    valid_until, remarks
) VALUES (
    100, 1, '長榮海運', 'shipping',
    '基隆港', '寧波港', 'EVERGREEN', '3-5天',
    '40HQ', 1200.00, 'USD',
    '2025-11-30', '含基本港雜費'
) RETURNING quote_id;

-- 5. 報價明細（費用拆分）
INSERT INTO quote_line_items (quote_id, fee_type_id, cost, currency)
VALUES 
    (201, 1, 900.00, 'USD'),  -- 海運費
    (201, 2, 250.00, 'USD'),  -- THC
    (201, 3, 50.00, 'USD');   -- 文件費

-- 6. 查詢該詢價的所有報價（用於比較）
SELECT 
    q.vendor_name,
    q.total_cost_display,
    q.base_currency,
    q.carrier,
    q.transit_time,
    q.valid_until
FROM quotes q
WHERE q.inquiry_id = 100
ORDER BY q.total_cost_display ASC;

-- 7. 更新詢價狀態
UPDATE inquiries 
SET status = 'quoted'
WHERE inquiry_id = 100;
```

---

## 遷移與部署

### 執行步驟

1. **在 Supabase SQL Editor 執行**
```sql
-- 執行完整的 schema_v2.sql
```

2. **驗證資料庫結構**
```sql
-- 檢查表格
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 檢查視圖
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 檢查索引
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

3. **測試資料**
```sql
-- 查詢範例供應商
SELECT * FROM vendors;

-- 查詢供應商聯絡人
SELECT 
    v.name AS vendor_name,
    vc.name AS contact_name,
    vc.email,
    vc.is_primary
FROM vendor_contacts vc
JOIN vendors v ON vc.vendor_id = v.vendor_id
ORDER BY v.name, vc.is_primary DESC;
```

---

## 最佳實踐

### 1. 查詢優化
- ✅ 使用視圖簡化複雜查詢
- ✅ 善用索引（特別是複合索引）
- ✅ 避免 `SELECT *`，只選擇需要的欄位
- ✅ 使用 `EXPLAIN ANALYZE` 分析查詢計劃

### 2. 資料完整性
- ✅ 使用外鍵約束
- ✅ 使用 CHECK 約束驗證資料
- ✅ 使用 NOT NULL 確保必填欄位
- ✅ 使用 UNIQUE 約束避免重複

### 3. 擴展性
- ✅ 使用 JSONB 存儲彈性資料
- ✅ 使用 ENUM 類型確保一致性
- ✅ 保留 `custom_fields` 欄位供未來擴展

### 4. 維護
- ✅ 定期執行 `VACUUM` 回收空間
- ✅ 定期執行 `ANALYZE` 更新統計資訊
- ✅ 使用 `cleanup_expired_quotes()` 清理過期資料
- ✅ 監控慢查詢並優化

---

**架構完成！準備好建立強大的報價管理系統了嗎？** 🚀

