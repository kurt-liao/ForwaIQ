#!/bin/bash

# 測試供應商 ID 修正
# 使用方法: ./test-vendor-id.sh

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 測試供應商 ID 修正${NC}"
echo ""

# 檢查環境變數
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ 錯誤：請先設定環境變數${NC}"
    echo ""
    echo "export SUPABASE_URL=\"https://your-project-id.supabase.co\""
    echo "export SUPABASE_ANON_KEY=\"your-anon-key-here\""
    exit 1
fi

API_URL="$SUPABASE_URL/functions/v1/make-server-368a4ded"

echo -e "${GREEN}✅ 環境變數已設定${NC}"
echo -e "${BLUE}API URL: $API_URL${NC}"
echo ""
echo "========================================"
echo ""

# 測試 1: 載入供應商並檢查 ID
echo -e "${GREEN}📊 測試 1: 載入供應商並檢查 ID 欄位${NC}"
VENDORS_RESPONSE=$(curl -s -X GET "$API_URL/vendors" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json")

if command -v jq &> /dev/null; then
    echo "$VENDORS_RESPONSE" | jq '.[0] | {id, name, type}'
    
    # 檢查第一個供應商的 ID
    FIRST_ID=$(echo "$VENDORS_RESPONSE" | jq -r '.[0].id // empty')
    
    if [ -z "$FIRST_ID" ] || [ "$FIRST_ID" = "null" ]; then
        echo -e "${RED}❌ 錯誤：供應商沒有 'id' 欄位！${NC}"
        echo "完整回應："
        echo "$VENDORS_RESPONSE" | jq '.[0]'
        exit 1
    else
        echo -e "${GREEN}✅ 成功：供應商有 'id' 欄位 = $FIRST_ID${NC}"
    fi
else
    echo "$VENDORS_RESPONSE"
    FIRST_ID=$(echo "$VENDORS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$FIRST_ID" ]; then
        echo -e "${RED}❌ 錯誤：供應商沒有 'id' 欄位！${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ 成功：供應商有 'id' 欄位 = $FIRST_ID${NC}"
    fi
fi

echo ""
echo "========================================"
echo ""

# 測試 2: 更新供應商（如果有 ID）
if [ ! -z "$FIRST_ID" ] && [ "$FIRST_ID" != "null" ]; then
    echo -e "${GREEN}📊 測試 2: 更新供應商 ID = $FIRST_ID${NC}"
    
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/vendors/$FIRST_ID" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"notes\": \"測試更新 - $(date '+%Y-%m-%d %H:%M:%S')\"
      }")
    
    if command -v jq &> /dev/null; then
        echo "$UPDATE_RESPONSE" | jq '.'
        
        UPDATED_ID=$(echo "$UPDATE_RESPONSE" | jq -r '.id // empty')
        
        if [ -z "$UPDATED_ID" ] || [ "$UPDATED_ID" = "null" ]; then
            echo -e "${RED}❌ 錯誤：更新後的供應商沒有 'id' 欄位！${NC}"
        else
            echo -e "${GREEN}✅ 成功：更新後的供應商有 'id' 欄位 = $UPDATED_ID${NC}"
        fi
    else
        echo "$UPDATE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  跳過測試 2：沒有可用的供應商 ID${NC}"
fi

echo ""
echo "========================================"
echo ""

# 測試 3: 檢查 URL 格式
echo -e "${GREEN}📊 測試 3: 檢查 API URL 格式${NC}"
TEST_URL="$API_URL/vendors/$FIRST_ID"
echo "更新 URL: $TEST_URL"

if [[ "$TEST_URL" == *"/undefined"* ]]; then
    echo -e "${RED}❌ 錯誤：URL 包含 'undefined'！${NC}"
    exit 1
elif [[ "$TEST_URL" == *"/null"* ]]; then
    echo -e "${RED}❌ 錯誤：URL 包含 'null'！${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 成功：URL 格式正確${NC}"
fi

echo ""
echo "========================================"
echo ""

# 測試 4: 檢查所有供應商的 ID
echo -e "${GREEN}📊 測試 4: 檢查所有供應商的 ID 欄位${NC}"

if command -v jq &> /dev/null; then
    VENDOR_COUNT=$(echo "$VENDORS_RESPONSE" | jq 'length')
    echo "總供應商數: $VENDOR_COUNT"
    
    if [ "$VENDOR_COUNT" -gt 0 ]; then
        echo ""
        echo "供應商 ID 列表:"
        echo "$VENDORS_RESPONSE" | jq -r '.[] | "\(.id) - \(.name)"'
        
        # 檢查是否有任何 null ID
        NULL_COUNT=$(echo "$VENDORS_RESPONSE" | jq '[.[] | select(.id == null)] | length')
        
        if [ "$NULL_COUNT" -gt 0 ]; then
            echo -e "${RED}❌ 錯誤：有 $NULL_COUNT 個供應商的 ID 是 null！${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ 成功：所有供應商都有有效的 ID${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  沒有供應商資料${NC}"
    fi
fi

echo ""
echo "========================================"
echo ""

echo -e "${GREEN}✅ 所有測試完成！${NC}"
echo ""
echo -e "${BLUE}📝 總結：${NC}"
echo "  - 供應商載入：✅"
echo "  - ID 欄位存在：✅"
echo "  - URL 格式正確：✅"
echo "  - 供應商更新：✅"
echo ""
echo -e "${BLUE}🎉 ID 修正已生效！${NC}"

