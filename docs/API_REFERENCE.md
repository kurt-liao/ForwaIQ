# 📡 API 參考文檔

ForwaIQ 後端 API 完整參考。

---

## 🔗 基礎資訊

### API 端點
```
https://{project_id}.supabase.co/functions/v1/make-server-368a4ded
```

### 認證
```javascript
headers: {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json'
}
```

---

## 📊 報價 API (Quotes)

### GET /quotes
取得所有報價

**回應：**
```typescript
Quote[] // 按價格排序（低到高）
```

**範例：**
```javascript
const response = await fetch(
  `${API_URL}/quotes`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
const quotes = await response.json();
```

---

### GET /quotes/:id
取得單一報價

**參數：**
- `id` (number) - 報價 ID (`quote_id`)

**回應：**
```typescript
Quote
```

---

### POST /quotes
新增報價

**請求 Body：**
```typescript
{
  vendorName: string;
  vendorType: 'shipping' | 'trucking' | 'customs';
  price: number;
  currency: string;
  validUntil: string; // ISO 8601 date
  
  // 選填欄位
  vendorId?: number;
  origin?: string;
  destination?: string;
  carrier?: string;
  transitTime?: string;
  containerSize?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  truckType?: string;
  customsType?: string;
  productCategory?: string;
  notes?: string;
  customFields?: Record<string, any>;
}
```

**回應：**
```typescript
Quote // 新建的報價
```

---

### POST /quotes/batch
批量新增報價

**請求 Body：**
```typescript
{
  quotes: Quote[] // 報價陣列
}
```

**回應：**
```typescript
{
  success: boolean;
  created: number;
  errors?: string[];
  quotes: Quote[];
}
```

---

### PUT /quotes/:id
更新報價

**參數：**
- `id` (number) - 報價 ID

**請求 Body：** 同 POST /quotes（部分欄位）

**回應：**
```typescript
Quote // 更新後的報價
```

---

### DELETE /quotes/:id
刪除報價

**參數：**
- `id` (number) - 報價 ID

**回應：**
```typescript
{ success: true }
```

---

### POST /quotes/search
搜尋報價

**請求 Body：**
```typescript
{
  vendorType?: 'shipping' | 'trucking' | 'customs' | 'all';
  origin?: string;
  destination?: string;
  containerSize?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}
```

**回應：**
```typescript
Quote[] // 符合條件的報價
```

---

## 👥 供應商 API (Vendors)

### GET /vendors
取得所有供應商

**回應：**
```typescript
Vendor[] // 按名稱排序
```

---

### GET /vendors/:id
取得單一供應商

**參數：**
- `id` (number) - 供應商 ID (`vendor_id`)

**回應：**
```typescript
Vendor
```

---

### POST /vendors
新增供應商

**請求 Body：**
```typescript
{
  name: string;
  type: 'shipping' | 'trucking' | 'customs';
  
  // 選填欄位
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number; // 0.0-5.0
  notes?: string;
}
```

**回應：**
```typescript
Vendor // 新建的供應商
```

---

### PUT /vendors/:id
更新供應商

**參數：**
- `id` (number) - 供應商 ID

**請求 Body：** 同 POST /vendors（部分欄位）

**回應：**
```typescript
Vendor // 更新後的供應商
```

---

### DELETE /vendors/:id
刪除供應商

**參數：**
- `id` (number) - 供應商 ID

**回應：**
```typescript
{ success: true }
```

---

## 📧 詢價 API (Inquiries)

### POST /send-inquiry
發送詢價

**請求 Body：**
```typescript
{
  vendorIds: number[]; // 供應商 ID 陣列
  subject: string;
  content: string;
  inquiryData?: Record<string, any>;
}
```

**回應：**
```typescript
{
  success: boolean;
  inquiryId: number;
  sentTo: number;
  recipients: Array<{ name: string; email: string }>;
  message: string;
}
```

---

## ⚙️ 自定義欄位 API (Custom Fields)

### GET /custom-fields
取得所有自定義欄位

**回應：**
```typescript
CustomField[] // 按 vendor_type 和 display_order 排序
```

---

### GET /custom-fields/vendor/:vendorType
取得特定類型的自定義欄位

**參數：**
- `vendorType` ('shipping' | 'trucking' | 'customs')

**回應：**
```typescript
CustomField[] // 該類型的欄位
```

---

### GET /custom-fields/:id
取得單一自定義欄位

**參數：**
- `id` (UUID) - 欄位 ID

**回應：**
```typescript
CustomField
```

---

### POST /custom-fields
新增自定義欄位

**請求 Body：**
```typescript
{
  name: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'textarea';
  vendorType: 'shipping' | 'trucking' | 'customs';
  options?: string[]; // fieldType='select' 時必填
  isRequired?: boolean;
  order?: number;
}
```

**回應：**
```typescript
CustomField // 新建的欄位
```

---

### PUT /custom-fields/:id
更新自定義欄位

**參數：**
- `id` (UUID) - 欄位 ID

**請求 Body：** 同 POST /custom-fields（部分欄位）

**回應：**
```typescript
CustomField // 更新後的欄位
```

---

### DELETE /custom-fields/:id
刪除自定義欄位

**參數：**
- `id` (UUID) - 欄位 ID

**回應：**
```typescript
{ success: true }
```

---

## 🔧 資料格式

### Quote
```typescript
interface Quote {
  id: string;           // 前端用（對應 quote_id）
  vendorName: string;
  vendorType: 'shipping' | 'trucking' | 'customs';
  price: number;
  currency: string;
  validUntil: string;   // ISO 8601 date
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
  
  // 海運
  origin?: string;
  destination?: string;
  carrier?: string;
  transitTime?: string;
  containerSize?: string;
  
  // 拖車
  pickupLocation?: string;
  deliveryLocation?: string;
  truckType?: string;
  
  // 報關
  customsType?: string;
  productCategory?: string;
  
  notes?: string;
  customFields?: Record<string, any>;
}
```

### Vendor
```typescript
interface Vendor {
  id: string;           // 前端用（對應 vendor_id）
  name: string;
  type: 'shipping' | 'trucking' | 'customs';
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;      // 0.0-5.0
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CustomField
```typescript
interface CustomField {
  id: string;           // UUID
  name: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'textarea';
  vendorType: 'shipping' | 'trucking' | 'customs';
  options?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔄 命名轉換

API 自動處理前端（camelCase）和資料庫（snake_case）之間的轉換：

**前端 → 資料庫：**
- `vendorName` → `vendor_name`
- `validUntil` → `valid_until`
- `createdAt` → `created_at`

**資料庫 → 前端：**
- `vendor_name` → `vendorName`
- `valid_until` → `validUntil`
- `created_at` → `createdAt`

---

## ⚠️ 錯誤處理

所有 API 錯誤回應格式：

```typescript
{
  error: string;        // 錯誤訊息
  details?: string;     // 詳細資訊
}
```

**常見 HTTP 狀態碼：**
- `200` - 成功
- `201` - 創建成功
- `400` - 請求錯誤（缺少必填欄位）
- `404` - 資源不存在
- `500` - 伺服器錯誤

---

## 📝 使用範例

### 完整範例：新增報價

```typescript
const addQuote = async (quoteData) => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorName: '長榮海運',
          vendorType: 'shipping',
          price: 1200,
          currency: 'USD',
          validUntil: '2025-12-31',
          origin: '基隆港',
          destination: '寧波港',
          carrier: 'EVERGREEN',
          transitTime: '3-5天',
          containerSize: '40HQ',
          notes: '含基本港雜費',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const newQuote = await response.json();
    console.log('報價新增成功:', newQuote);
    return newQuote;
  } catch (error) {
    console.error('新增報價失敗:', error);
    throw error;
  }
};
```

---

## 🔗 相關文檔

- [資料庫架構](./DATABASE_ARCHITECTURE.md) - 了解資料表結構
- [快速參考](./QUICK_REFERENCE.md) - 常用查詢
- [快速啟動](./QUICK_START.md) - 設置指南

---

**API 已完全遷移到 PostgreSQL，享受強大的查詢能力！** 🚀

