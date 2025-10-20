#!/bin/bash

# ForwaIQ API 測試腳本
# 使用方法: ./test-api.sh

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  建議安裝 jq 以美化 JSON 輸出：brew install jq${NC}"
    JQ_CMD="cat"
else
    JQ_CMD="jq '.'"
fi

# ========================================
# 🔧 設定你的 Supabase 資訊
# ========================================
echo -e "${YELLOW}請先設定你的 Supabase 資訊：${NC}"
echo ""
echo "export SUPABASE_URL=\"https://your-project-id.supabase.co\""
echo "export SUPABASE_ANON_KEY=\"your-anon-key-here\""
echo ""

# 檢查環境變數
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ 錯誤：請先設定環境變數${NC}"
    echo ""
    echo "執行以下命令："
    echo "export SUPABASE_URL=\"https://your-project-id.supabase.co\""
    echo "export SUPABASE_ANON_KEY=\"your-anon-key-here\""
    echo ""
    echo "然後再執行此腳本"
    exit 1
fi

export API_URL="$SUPABASE_URL/functions/v1/make-server-368a4ded"

echo -e "${GREEN}✅ 環境變數已設定${NC}"
echo -e "${BLUE}API URL: $API_URL${NC}"
echo ""
echo "========================================"
echo ""

# ========================================
# 測試開始
# ========================================
echo -e "${BLUE}🧪 開始測試 ForwaIQ API...${NC}"
echo ""

# 測試 1: 取得所有報價
echo -e "${GREEN}📊 測試 1: GET /quotes - 取得所有報價${NC}"
curl -X GET "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 測試 2: 新增海運報價
echo -e "${GREEN}📊 測試 2: POST /quotes - 新增海運報價${NC}"
QUOTE_RESPONSE=$(curl -X POST "$API_URL/quotes" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "測試海運公司",
    "vendorType": "shipping",
    "price": 1200,
    "currency": "USD",
    "validUntil": "2025-12-31",
    "origin": "基隆港",
    "destination": "寧波港",
    "carrier": "TEST LINE",
    "transitTime": "3-5天",
    "containerSize": "40HQ",
    "notes": "測試報價"
  }' -s)

echo $QUOTE_RESPONSE | eval $JQ_CMD

if command -v jq &> /dev/null; then
    QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.id // .quoteId // empty')
    if [ ! -z "$QUOTE_ID" ] && [ "$QUOTE_ID" != "null" ]; then
        echo -e "${BLUE}新建報價 ID: $QUOTE_ID${NC}"
    else
        echo -e "${YELLOW}⚠️  無法取得報價 ID（可能是資料格式問題）${NC}"
        QUOTE_ID=""
    fi
fi
echo ""
echo "========================================"
echo ""

# 測試 3: 取得單一報價（如果有 ID）
if [ ! -z "$QUOTE_ID" ]; then
    echo -e "${GREEN}📊 測試 3: GET /quotes/:id - 取得單一報價${NC}"
    curl -X GET "$API_URL/quotes/$QUOTE_ID" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -s | eval $JQ_CMD
    echo ""
    echo "========================================"
    echo ""
fi

# 測試 4: 搜尋報價
echo -e "${GREEN}📊 測試 4: POST /quotes/search - 搜尋報價${NC}"
curl -X POST "$API_URL/quotes/search" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorType": "shipping",
    "minPrice": 1000,
    "maxPrice": 2000
  }' -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 測試 5: 更新報價（如果有 ID）
if [ ! -z "$QUOTE_ID" ]; then
    echo -e "${GREEN}📊 測試 5: PUT /quotes/:id - 更新報價${NC}"
    curl -X PUT "$API_URL/quotes/$QUOTE_ID" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 1150,
        "notes": "價格已更新（測試）"
      }' -s | eval $JQ_CMD
    echo ""
    echo "========================================"
    echo ""
fi

# 測試 6: 取得所有供應商
echo -e "${GREEN}👥 測試 6: GET /vendors - 取得所有供應商${NC}"
curl -X GET "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 測試 7: 新增供應商
echo -e "${GREEN}👥 測試 7: POST /vendors - 新增供應商${NC}"
VENDOR_RESPONSE=$(curl -X POST "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試供應商",
    "type": "shipping",
    "contactPerson": "測試聯絡人",
    "email": "test@example.com",
    "phone": "02-12345678",
    "rating": 4.5,
    "notes": "測試用供應商"
  }' -s)

echo $VENDOR_RESPONSE | eval $JQ_CMD

if command -v jq &> /dev/null; then
    VENDOR_ID=$(echo $VENDOR_RESPONSE | jq -r '.id // .vendorId // empty')
    if [ ! -z "$VENDOR_ID" ] && [ "$VENDOR_ID" != "null" ]; then
        echo -e "${BLUE}新建供應商 ID: $VENDOR_ID${NC}"
    fi
fi
echo ""
echo "========================================"
echo ""

# 測試 8: 取得自定義欄位
echo -e "${GREEN}⚙️  測試 8: GET /custom-fields - 取得自定義欄位${NC}"
curl -X GET "$API_URL/custom-fields" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 測試 9: 取得海運類型的自定義欄位
echo -e "${GREEN}⚙️  測試 9: GET /custom-fields/vendor/shipping - 取得海運自定義欄位${NC}"
curl -X GET "$API_URL/custom-fields/vendor/shipping" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 測試 10: 批次新增報價
echo -e "${GREEN}📊 測試 10: POST /quotes/batch - 批次新增報價${NC}"
curl -X POST "$API_URL/quotes/batch" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "quotes": [
      {
        "vendorName": "批次測試1",
        "vendorType": "shipping",
        "price": 1000,
        "currency": "USD",
        "validUntil": "2025-12-31",
        "origin": "基隆",
        "destination": "上海"
      },
      {
        "vendorName": "批次測試2",
        "vendorType": "trucking",
        "price": 800,
        "currency": "TWD",
        "validUntil": "2025-11-30",
        "pickupLocation": "桃園",
        "deliveryLocation": "台中"
      }
    ]
  }' -s | eval $JQ_CMD
echo ""
echo "========================================"
echo ""

# 清理測試資料（可選）
echo -e "${YELLOW}🗑️  清理測試資料...${NC}"
if [ ! -z "$QUOTE_ID" ]; then
    echo "刪除測試報價 ID: $QUOTE_ID"
    curl -X DELETE "$API_URL/quotes/$QUOTE_ID" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -s | eval $JQ_CMD
    echo ""
fi

if [ ! -z "$VENDOR_ID" ]; then
    echo "刪除測試供應商 ID: $VENDOR_ID"
    curl -X DELETE "$API_URL/vendors/$VENDOR_ID" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -s | eval $JQ_CMD
    echo ""
fi

echo "========================================"
echo ""
echo -e "${GREEN}✅ 測試完成！${NC}"
echo ""
echo -e "${BLUE}📚 更多資訊請參考：${NC}"
echo "  - docs/API_TESTING.md"
echo "  - docs/API_REFERENCE.md"
echo ""

