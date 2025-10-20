cl# 🧪 測試腳本

ForwaIQ API 測試腳本集合。

---

## 📁 測試腳本

### 1. test-api.sh - 完整 API 測試

**用途**: 測試所有 API 端點的完整功能

**測試內容**:
- ✅ 報價管理 (Quotes)
  - GET /quotes - 取得所有報價
  - POST /quotes - 新增報價
  - GET /quotes/:id - 取得單一報價
  - PUT /quotes/:id - 更新報價
  - POST /quotes/search - 搜尋報價
  - POST /quotes/batch - 批次新增
  
- ✅ 供應商管理 (Vendors)
  - GET /vendors - 取得所有供應商
  - POST /vendors - 新增供應商
  
- ✅ 自定義欄位 (Custom Fields)
  - GET /custom-fields - 取得所有欄位
  - GET /custom-fields/vendor/:type - 取得特定類型欄位

**使用方法**:
```bash
# 1. 設定環境變數
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# 2. 執行測試
./tests/test-api.sh
```

**特色**:
- 🎨 彩色輸出
- 🔄 自動清理測試資料
- 📊 支援 jq 美化 JSON
- ✅ 完整的錯誤處理

---

### 2. test-vendor-id.sh - 供應商 ID 測試

**用途**: 專門測試供應商 ID 欄位是否正確

**測試內容**:
- ✅ 檢查 API 返回的供應商是否有 `id` 欄位
- ✅ 驗證更新供應商時 ID 正確傳遞
- ✅ 確認 URL 不含 `undefined` 或 `null`
- ✅ 檢查所有供應商的 ID 有效性

**使用方法**:
```bash
# 1. 設定環境變數
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# 2. 執行測試
./tests/test-vendor-id.sh
```

**特色**:
- 🎯 專注於 ID 欄位驗證
- 🔍 詳細的診斷資訊
- ✅ 自動檢測問題

---

## 🚀 快速開始

### 一次設定，多次使用

```bash
# 在 ~/.zshrc 或 ~/.bashrc 中加入
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# 重新載入
source ~/.zshrc
```

### 執行所有測試

```bash
# 完整 API 測試
./tests/test-api.sh

# 供應商 ID 測試
./tests/test-vendor-id.sh
```

---

## 📊 測試輸出範例

### 成功輸出
```
🧪 開始測試 ForwaIQ API...

✅ 環境變數已設定
API URL: https://xxx.supabase.co/functions/v1/make-server-368a4ded

========================================

📊 測試 1: GET /quotes - 取得所有報價
Retrieved 5 quotes from Supabase
[
  {
    "id": "1",
    "vendorName": "長榮海運",
    "price": 1200,
    ...
  }
]

========================================

✅ 測試完成！
```

### 錯誤輸出
```
❌ 錯誤：請先設定環境變數

執行以下命令：
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

---

## 🔧 疑難排解

### 問題 1: 權限錯誤
```bash
# 給予執行權限
chmod +x tests/*.sh
```

### 問題 2: jq 未安裝
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### 問題 3: 401 Unauthorized
```bash
# 檢查 Anon Key 是否正確
echo $SUPABASE_ANON_KEY

# 重新設定
export SUPABASE_ANON_KEY="your-correct-anon-key"
```

### 問題 4: 404 Not Found
```bash
# 檢查 Function 是否已部署
supabase functions list

# 重新部署
supabase functions deploy make-server-368a4ded
```

---

## 📝 測試最佳實踐

### 1. 定期執行測試
```bash
# 每次修改 API 後執行
./tests/test-api.sh

# 部署前執行
./tests/test-api.sh && ./tests/test-vendor-id.sh
```

### 2. 查看詳細日誌
```bash
# 儲存測試結果
./tests/test-api.sh > test-results.log 2>&1

# 查看結果
cat test-results.log
```

### 3. 只測試特定功能
```bash
# 編輯腳本，註解掉不需要的測試
# 或創建自定義測試腳本
```

---

## 🔗 相關文檔

- [API 參考文檔](../docs/API_REFERENCE.md) - 完整 API 說明
- [API 測試指南](../docs/API_TESTING.md) - 詳細測試方法
- [快速啟動](../docs/QUICK_START.md) - 專案設置

---

## 💡 提示

### 使用別名加速測試
```bash
# 在 ~/.zshrc 中加入
alias test-api="cd /Users/kurt/Desktop/ForwaIQ && ./tests/test-api.sh"
alias test-vendor="cd /Users/kurt/Desktop/ForwaIQ && ./tests/test-vendor-id.sh"

# 使用
test-api
test-vendor
```

### 持續整合 (CI)
```yaml
# .github/workflows/test.yml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run API Tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: ./tests/test-api.sh
```

---

**開始測試你的 API！** 🚀

