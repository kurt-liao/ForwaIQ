# 📚 Custom Fields 快速參考

> 快速查找常用的 SQL 查詢、API 端點和故障排除方法

---

## 🗄️ 資料庫查詢

### 基本查詢

```sql
-- 查看所有欄位
SELECT * FROM custom_fields ORDER BY vendor_type, display_order;

-- 查看特定類型的欄位
SELECT * FROM custom_fields WHERE vendor_type = 'shipping';

-- 統計欄位數量
SELECT vendor_type, COUNT(*) as count
FROM custom_fields
GROUP BY vendor_type;

-- 查看必填欄位
SELECT * FROM custom_fields WHERE is_required = true;
```

### 進階查詢

```sql
-- 查看最近新增的欄位
SELECT * FROM custom_fields 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看最近更新的欄位
SELECT * FROM custom_fields 
ORDER BY updated_at DESC 
LIMIT 10;

-- 查看有選項的欄位（下拉選單）
SELECT name, vendor_type, options 
FROM custom_fields 
WHERE field_type = 'select';

-- 檢查是否有重複的欄位名稱（應該返回 0）
SELECT name, vendor_type, COUNT(*) 
FROM custom_fields 
GROUP BY name, vendor_type 
HAVING COUNT(*) > 1;
```

### 維護查詢

```sql
-- 刪除測試資料
DELETE FROM custom_fields WHERE name LIKE '%測試%';

-- 重設顯示順序
UPDATE custom_fields 
SET display_order = row_number() OVER (PARTITION BY vendor_type ORDER BY created_at)
WHERE vendor_type = 'shipping';

-- 備份欄位資料
CREATE TABLE custom_fields_backup AS 
SELECT * FROM custom_fields;

-- 還原備份
INSERT INTO custom_fields 
SELECT * FROM custom_fields_backup
ON CONFLICT (id) DO NOTHING;
```

---

## 🔌 API 端點速查

### Base URL
```
https://your-project.supabase.co/functions/v1/make-server-368a4ded
```

### Headers
```
Authorization: Bearer your-anon-key
Content-Type: application/json
```

### 端點列表

| 方法 | 端點 | 說明 |
|-----|------|------|
| GET | `/custom-fields` | 取得所有欄位 |
| GET | `/custom-fields/vendor/:type` | 取得特定類型欄位 |
| GET | `/custom-fields/:id` | 取得單一欄位 |
| POST | `/custom-fields` | 新增欄位 |
| PUT | `/custom-fields/:id` | 更新欄位 |
| DELETE | `/custom-fields/:id` | 刪除欄位 |

### 請求範例

#### 新增文字欄位
```json
POST /custom-fields
{
  "name": "靠泊碼頭",
  "fieldType": "text",
  "vendorType": "shipping",
  "isRequired": false,
  "order": 1
}
```

#### 新增下拉選單
```json
POST /custom-fields
{
  "name": "報關方式",
  "fieldType": "select",
  "vendorType": "customs",
  "options": ["一般報關", "快速通關", "C3自主管理"],
  "isRequired": true,
  "order": 1
}
```

#### 更新欄位
```json
PUT /custom-fields/:id
{
  "name": "更新後的名稱",
  "isRequired": true,
  "order": 2
}
```

---

## 🔧 常用命令

### Supabase CLI

```bash
# 登入
supabase login

# 連接專案
supabase link --project-ref your-project-ref

# 部署 Edge Function
supabase functions deploy make-server-368a4ded

# 查看 Edge Function 日誌
supabase functions logs make-server-368a4ded

# 執行 SQL
supabase db execute --file schema.sql
```

### 測試命令

```bash
# 使用 curl 測試 API
curl -X GET \
  "https://your-project.supabase.co/functions/v1/make-server-368a4ded/custom-fields" \
  -H "Authorization: Bearer your-anon-key"

# 新增欄位
curl -X POST \
  "https://your-project.supabase.co/functions/v1/make-server-368a4ded/custom-fields" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試欄位",
    "fieldType": "text",
    "vendorType": "shipping",
    "isRequired": false,
    "order": 1
  }'
```

---

## 🐛 故障排除速查

### 問題：API 回傳 500 錯誤

**檢查步驟：**
1. 查看 Edge Function Logs
2. 檢查環境變數
3. 驗證資料庫連接

**解決方案：**
```sql
-- 檢查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'custom_fields'
);

-- 檢查權限
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'custom_fields';
```

### 問題：欄位無法載入

**檢查步驟：**
1. 開啟瀏覽器 Console
2. 查看 Network 標籤
3. 檢查 API 回應

**解決方案：**
```javascript
// 在瀏覽器 Console 執行
fetch('https://your-project.supabase.co/functions/v1/make-server-368a4ded/custom-fields', {
  headers: {
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 問題：無法新增重複名稱

**這是正常行為！**

```sql
-- 檢查現有欄位
SELECT name, vendor_type FROM custom_fields 
WHERE name = '你的欄位名稱';

-- 如需刪除舊欄位
DELETE FROM custom_fields 
WHERE name = '你的欄位名稱' 
  AND vendor_type = 'shipping';
```

### 問題：options 顯示為字串

**檢查資料格式：**
```sql
-- 檢查 options 欄位格式
SELECT name, 
       options, 
       jsonb_typeof(options) as type,
       jsonb_array_length(options) as length
FROM custom_fields 
WHERE field_type = 'select';

-- 修正格式（如果需要）
UPDATE custom_fields 
SET options = '["選項1", "選項2"]'::jsonb
WHERE id = 'your-field-id';
```

---

## 📊 監控查詢

### 效能監控

```sql
-- 查看表大小
SELECT pg_size_pretty(pg_total_relation_size('custom_fields')) as size;

-- 查看索引使用情況
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'custom_fields';

-- 查看最慢的查詢（需要 pg_stat_statements）
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%custom_fields%'
ORDER BY mean_time DESC
LIMIT 10;
```

### 資料完整性檢查

```sql
-- 檢查 NULL 值
SELECT 
  COUNT(*) FILTER (WHERE name IS NULL) as null_names,
  COUNT(*) FILTER (WHERE field_type IS NULL) as null_types,
  COUNT(*) FILTER (WHERE vendor_type IS NULL) as null_vendors
FROM custom_fields;

-- 檢查無效的 field_type
SELECT DISTINCT field_type 
FROM custom_fields 
WHERE field_type NOT IN ('text', 'number', 'select', 'date', 'textarea');

-- 檢查無效的 vendor_type
SELECT DISTINCT vendor_type 
FROM custom_fields 
WHERE vendor_type NOT IN ('shipping', 'trucking', 'customs');
```

---

## 🔐 安全檢查

### 權限檢查

```sql
-- 檢查表權限
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'custom_fields';

-- 檢查 RLS 狀態
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'custom_fields';
```

### 環境變數檢查

在 Edge Function 中：
```typescript
// 檢查環境變數是否存在
console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? '✓' : '✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✓' : '✗');
```

---

## 📈 效能優化

### 索引優化

```sql
-- 檢查未使用的索引
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'custom_fields'
  AND idx_scan = 0;

-- 新增複合索引（如果需要）
CREATE INDEX idx_custom_fields_type_required 
ON custom_fields(vendor_type, is_required);

-- 分析表統計資訊
ANALYZE custom_fields;
```

### 查詢優化

```sql
-- 使用 EXPLAIN 分析查詢
EXPLAIN ANALYZE
SELECT * FROM custom_fields 
WHERE vendor_type = 'shipping' 
ORDER BY display_order;

-- 查看查詢計畫
EXPLAIN (FORMAT JSON)
SELECT * FROM custom_fields 
WHERE vendor_type = 'shipping';
```

---

## 🔄 資料遷移腳本

### 從 KV Store 遷移

```typescript
// 遷移腳本範例
const migrateFromKV = async () => {
  // 1. 讀取 KV Store 資料
  const oldFields = await kv.getByPrefix('customField:');
  
  // 2. 轉換並插入
  for (const field of oldFields) {
    await fetch(`${SUPABASE_URL}/rest/v1/custom_fields`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: field.name,
        field_type: field.fieldType,
        vendor_type: field.vendorType,
        options: JSON.stringify(field.options || []),
        is_required: field.isRequired,
        display_order: field.order,
      })
    });
  }
  
  console.log(`遷移完成：${oldFields.length} 個欄位`);
};
```

### 批次插入範例資料

```sql
-- 插入範例欄位
INSERT INTO custom_fields (name, field_type, vendor_type, is_required, display_order) VALUES
('靠泊碼頭', 'text', 'shipping', false, 1),
('船期', 'date', 'shipping', false, 2),
('車牌號碼', 'text', 'trucking', false, 1),
('司機姓名', 'text', 'trucking', false, 2),
('報關方式', 'select', 'customs', true, 1)
ON CONFLICT (name, vendor_type) DO NOTHING;

-- 更新下拉選單選項
UPDATE custom_fields 
SET options = '["一般報關", "快速通關", "C3自主管理"]'::jsonb
WHERE name = '報關方式';
```

---

## 📝 欄位型別參考

| fieldType | 說明 | 前端組件 | 驗證 |
|-----------|------|---------|------|
| `text` | 單行文字 | `<Input>` | 字串 |
| `number` | 數字 | `<Input type="number">` | 數字 |
| `select` | 下拉選單 | `<select>` | options 必須有值 |
| `date` | 日期 | `<Input type="date">` | ISO 8601 |
| `textarea` | 多行文字 | `<Textarea>` | 字串 |

---

## 🎯 最佳實踐

### 命名規範
- ✅ 使用清楚的中文名稱：`靠泊碼頭`
- ✅ 避免過長的名稱：< 20 字
- ❌ 避免特殊符號：`@#$%`

### 欄位設計
- ✅ 必填欄位數量適中（< 5 個）
- ✅ 下拉選單選項清楚明確
- ✅ 使用合理的顯示順序
- ❌ 避免建立過多欄位（> 20 個）

### 效能考量
- ✅ 使用索引加速查詢
- ✅ 定期清理無用欄位
- ✅ 監控 API 回應時間
- ❌ 避免頻繁的大量更新

---

## 🔗 相關連結

- [Supabase Dashboard](https://app.supabase.com)
- [PostgREST API 文檔](https://postgrest.org)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)

---

## 📞 快速支援

### 檢查清單
1. ✅ 檢查資料庫表是否存在
2. ✅ 檢查 Edge Function 是否部署
3. ✅ 檢查環境變數是否設定
4. ✅ 檢查 API 端點是否正確
5. ✅ 檢查瀏覽器 Console 錯誤

### 常用連結
- Edge Function Logs: Dashboard > Edge Functions > Logs
- SQL Editor: Dashboard > SQL Editor
- API Settings: Dashboard > Settings > API

---

**最後更新：** 2025-10-20  
**版本：** v2.0

