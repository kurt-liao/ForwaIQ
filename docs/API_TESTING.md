# 🧪 API 測試指南

使用 cURL 測試 ForwaIQ API 的完整指南。

---

## 🔧 準備工作

### 1. 取得你的 Supabase 資訊

前往 [Supabase Dashboard](https://app.supabase.com) → 選擇專案 → Settings → API

需要：
- **Project URL**: `https://your-project-id.supabase.co`
- **Anon Key**: `eyJhbGc...` (公開金鑰)

### 2. 設定環境變數（推薦）

```bash
# 設定環境變數
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
export API_URL="$SUPABASE_URL/functions/v1/make-server-368a4ded"
```

---

## 📊 報價 API 測試

### 1. 取得所有報價

```bash
curl -X GET "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

**直接替換版本：**
```bash
curl -X GET "https://your-project-id.supabase.co/functions/v1/make-server-368a4ded/quotes" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**預期回應：**
```json
[
  {
    "id": "1",
    "vendorName": "長榮海運",
    "vendorType": "shipping",
    "price": 1200,
    "currency": "USD",
    "validUntil": "2025-12-31",
    "origin": "基隆港",
    "destination": "寧波港",
    "createdAt": "2025-10-20T10:30:00.000Z"
  }
]
```

---

### 2. 取得單一報價

```bash
curl -X GET "$API_URL/quotes/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

**直接替換版本：**
```bash
curl -X GET "https://your-project-id.supabase.co/functions/v1/make-server-368a4ded/quotes/1" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

---

### 3. 新增報價（海運）

```bash
curl -X POST "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "長榮海運",
    "vendorType": "shipping",
    "price": 1200,
    "currency": "USD",
    "validUntil": "2025-12-31",
    "origin": "基隆港",
    "destination": "寧波港",
    "carrier": "EVERGREEN",
    "transitTime": "3-5天",
    "containerSize": "40HQ",
    "notes": "含基本港雜費"
  }'
```

**直接替換版本：**
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/make-server-368a4ded/quotes" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"vendorName":"長榮海運","vendorType":"shipping","price":1200,"currency":"USD","validUntil":"2025-12-31","origin":"基隆港","destination":"寧波港","carrier":"EVERGREEN","transitTime":"3-5天","containerSize":"40HQ","notes":"含基本港雜費"}'
```

---

### 4. 新增報價（拖車）

```bash
curl -X POST "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "順豐拖車",
    "vendorType": "trucking",
    "price": 800,
    "currency": "TWD",
    "validUntil": "2025-11-30",
    "pickupLocation": "桃園機場",
    "deliveryLocation": "台中工業區",
    "truckType": "20呎平板車",
    "notes": "含裝卸費"
  }'
```

---

### 5. 新增報價（報關）

```bash
curl -X POST "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "萬通報關",
    "vendorType": "customs",
    "price": 5000,
    "currency": "TWD",
    "validUntil": "2025-12-31",
    "customsType": "進口報關",
    "productCategory": "電子產品",
    "notes": "含稅則查詢"
  }'
```

---

### 6. 更新報價

```bash
curl -X PUT "$API_URL/quotes/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1150,
    "notes": "價格已調整"
  }'
```

---

### 7. 刪除報價

```bash
curl -X DELETE "$API_URL/quotes/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### 8. 搜尋報價

```bash
curl -X POST "$API_URL/quotes/search" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorType": "shipping",
    "origin": "基隆",
    "minPrice": 1000,
    "maxPrice": 5000
  }'
```

---

### 9. 批次新增報價

```bash
curl -X POST "$API_URL/quotes/batch" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "quotes": [
      {
        "vendorName": "長榮海運",
        "vendorType": "shipping",
        "price": 1200,
        "currency": "USD",
        "validUntil": "2025-12-31",
        "origin": "基隆港",
        "destination": "寧波港"
      },
      {
        "vendorName": "陽明海運",
        "vendorType": "shipping",
        "price": 1150,
        "currency": "USD",
        "validUntil": "2025-12-31",
        "origin": "基隆港",
        "destination": "寧波港"
      }
    ]
  }'
```

---

## 👥 供應商 API 測試

### 1. 取得所有供應商

```bash
curl -X GET "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### 2. 取得單一供應商

```bash
curl -X GET "$API_URL/vendors/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### 3. 新增供應商

```bash
curl -X POST "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "長榮海運",
    "type": "shipping",
    "contactPerson": "王小明",
    "email": "contact@evergreen.com",
    "phone": "02-12345678",
    "address": "台北市信義區",
    "rating": 4.5,
    "notes": "主要合作夥伴"
  }'
```

---

### 4. 更新供應商

```bash
curl -X PUT "$API_URL/vendors/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5.0,
    "notes": "服務優良"
  }'
```

---

### 5. 刪除供應商

```bash
curl -X DELETE "$API_URL/vendors/1" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 📧 詢價 API 測試

### 發送詢價

```bash
curl -X POST "$API_URL/send-inquiry" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorIds": [1, 2, 3],
    "subject": "海運報價詢問",
    "content": "您好，我們需要從基隆到寧波的40HQ櫃報價，請提供最新價格。",
    "inquiryData": {
      "origin": "基隆港",
      "destination": "寧波港",
      "containerSize": "40HQ",
      "cargoType": "電子產品"
    }
  }'
```

---

## ⚙️ 自定義欄位 API 測試

### 1. 取得所有自定義欄位

```bash
curl -X GET "$API_URL/custom-fields" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### 2. 取得特定類型的自定義欄位

```bash
curl -X GET "$API_URL/custom-fields/vendor/shipping" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### 3. 新增自定義欄位

```bash
curl -X POST "$API_URL/custom-fields" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "船公司",
    "fieldType": "select",
    "vendorType": "shipping",
    "options": ["EVERGREEN", "YANG MING", "COSCO", "MAERSK"],
    "isRequired": true,
    "order": 1
  }'
```

---

### 4. 更新自定義欄位

```bash
curl -X PUT "$API_URL/custom-fields/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "主要船公司",
    "isRequired": false
  }'
```

---

### 5. 刪除自定義欄位

```bash
curl -X DELETE "$API_URL/custom-fields/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 🎯 完整測試腳本

### 建立測試腳本

創建 `test-api.sh`：

```bash
#!/bin/bash

# 設定環境變數
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"
export API_URL="$SUPABASE_URL/functions/v1/make-server-368a4ded"

echo "🧪 開始測試 ForwaIQ API..."
echo ""

# 測試 1: 取得所有報價
echo "📊 測試 1: 取得所有報價"
curl -X GET "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""

# 測試 2: 新增報價
echo "📊 測試 2: 新增報價"
QUOTE_RESPONSE=$(curl -X POST "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "測試供應商",
    "vendorType": "shipping",
    "price": 1000,
    "currency": "USD",
    "validUntil": "2025-12-31",
    "origin": "基隆港",
    "destination": "上海港"
  }' -s)
echo $QUOTE_RESPONSE | jq '.'
QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.id')
echo "新建報價 ID: $QUOTE_ID"
echo ""

# 測試 3: 取得單一報價
echo "📊 測試 3: 取得單一報價"
curl -X GET "$API_URL/quotes/$QUOTE_ID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""

# 測試 4: 更新報價
echo "📊 測試 4: 更新報價"
curl -X PUT "$API_URL/quotes/$QUOTE_ID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 950,
    "notes": "價格已更新"
  }' -s | jq '.'
echo ""

# 測試 5: 搜尋報價
echo "📊 測試 5: 搜尋報價"
curl -X POST "$API_URL/quotes/search" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorType": "shipping",
    "minPrice": 900,
    "maxPrice": 1100
  }' -s | jq '.'
echo ""

# 測試 6: 刪除報價
echo "📊 測試 6: 刪除報價"
curl -X DELETE "$API_URL/quotes/$QUOTE_ID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""

# 測試 7: 取得所有供應商
echo "👥 測試 7: 取得所有供應商"
curl -X GET "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""

# 測試 8: 取得自定義欄位
echo "⚙️  測試 8: 取得自定義欄位"
curl -X GET "$API_URL/custom-fields" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | jq '.'
echo ""

echo "✅ 測試完成！"
```

### 執行測試

```bash
# 給予執行權限
chmod +x test-api.sh

# 執行測試
./test-api.sh
```

---

## 🔍 使用 jq 美化輸出

安裝 jq（JSON 處理工具）：

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# 使用
curl ... | jq '.'
```

---

## 📝 常見問題

### 1. 401 Unauthorized

**問題：** Authorization header 錯誤

**解決：**
```bash
# 確認 Anon Key 正確
echo $SUPABASE_ANON_KEY

# 檢查 header 格式
-H "Authorization: Bearer your-key-here"
```

---

### 2. 404 Not Found

**問題：** API 端點錯誤

**解決：**
```bash
# 確認 URL 正確
echo $API_URL

# 確認 Function 已部署
supabase functions list
```

---

### 3. 500 Internal Server Error

**問題：** 伺服器錯誤

**解決：**
```bash
# 查看 Function 日誌
supabase functions logs make-server-368a4ded

# 檢查資料庫連接
# 前往 Supabase Dashboard → Database
```

---

## 🛠️ 進階測試工具

### 1. Postman

匯入 Collection：
```json
{
  "info": {
    "name": "ForwaIQ API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-project-id.supabase.co/functions/v1/make-server-368a4ded"
    },
    {
      "key": "anonKey",
      "value": "your-anon-key"
    }
  ]
}
```

### 2. HTTPie

更友善的 HTTP 客戶端：

```bash
# 安裝
brew install httpie

# 使用
http GET $API_URL/quotes \
  Authorization:"Bearer $SUPABASE_ANON_KEY"
```

### 3. Insomnia

圖形化 REST 客戶端，支援環境變數和測試腳本。

---

## 🔗 相關文檔

- [API_REFERENCE.md](./API_REFERENCE.md) - 完整 API 文檔
- [QUICK_START.md](./QUICK_START.md) - 快速啟動
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) - 資料庫架構

---

**開始測試你的 API！** 🚀

