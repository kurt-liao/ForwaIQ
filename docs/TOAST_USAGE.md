# 🎨 Toast Notification 使用指南

ForwaIQ 專案中的 Toast 通知使用指南。

---

## 📦 套件

使用 **Sonner** - 一個美觀且功能強大的 React toast 庫。

```json
{
  "sonner": "^2.0.3"
}
```

---

## 🎨 顏色主題

### ✅ 成功訊息（綠色）
- **背景**: 淺綠色 (`bg-green-50`)
- **文字**: 深綠色 (`text-green-900`)
- **邊框**: 綠色 (`border-green-200`)

### ❌ 錯誤訊息（紅色）
- **背景**: 淺紅色 (`bg-red-50`)
- **文字**: 深紅色 (`text-red-900`)
- **邊框**: 紅色 (`border-red-200`)

### ⚠️ 警告訊息（黃色）
- **背景**: 淺黃色 (`bg-yellow-50`)
- **文字**: 深黃色 (`text-yellow-900`)
- **邊框**: 黃色 (`border-yellow-200`)

### ℹ️ 資訊訊息（藍色）
- **背景**: 淺藍色 (`bg-blue-50`)
- **文字**: 深藍色 (`text-blue-900`)
- **邊框**: 藍色 (`border-blue-200`)

---

## 📖 使用方法

### 1. 匯入 toast

```typescript
import { toast } from 'sonner';
```

### 2. 成功訊息

```typescript
// 基本用法
toast.success('操作成功！');

// 帶描述
toast.success('供應商新增成功！', {
  description: '已成功新增供應商資料到資料庫',
});

// 帶動作按鈕
toast.success('報價已儲存', {
  action: {
    label: '查看',
    onClick: () => console.log('查看報價'),
  },
});
```

**範例**:
```typescript
// VendorsPage.tsx
const handleAddVendor = async (vendorData: any) => {
  try {
    const response = await fetch(`${API_URL}/vendors`, {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
    
    if (response.ok) {
      toast.success('供應商新增成功！');
    }
  } catch (error) {
    toast.error('新增供應商失敗');
  }
};
```

---

### 3. 錯誤訊息

```typescript
// 基本用法
toast.error('操作失敗！');

// 帶描述
toast.error('載入資料失敗', {
  description: '請檢查網路連線後重試',
});

// 帶錯誤詳情
toast.error('API 請求失敗', {
  description: `錯誤代碼: ${error.code}`,
});
```

**範例**:
```typescript
// QuotesPage.tsx
const handleDeleteQuote = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/quotes/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      toast.success('報價已刪除');
    } else {
      const error = await response.json();
      toast.error('刪除報價失敗', {
        description: error.message || '未知錯誤',
      });
    }
  } catch (error) {
    toast.error('刪除報價時發生錯誤');
  }
};
```

---

### 4. 警告訊息

```typescript
// 基本用法
toast.warning('請注意！');

// 帶描述
toast.warning('資料即將過期', {
  description: '此報價將在 3 天後失效',
});

// 帶動作
toast.warning('未儲存的變更', {
  description: '您有未儲存的變更',
  action: {
    label: '儲存',
    onClick: () => saveChanges(),
  },
});
```

**範例**:
```typescript
// 檢查報價有效期
const checkQuoteExpiry = (quote: Quote) => {
  const daysUntilExpiry = getDaysUntilExpiry(quote.validUntil);
  
  if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
    toast.warning('報價即將過期', {
      description: `此報價將在 ${daysUntilExpiry} 天後失效`,
    });
  }
};
```

---

### 5. 資訊訊息

```typescript
// 基本用法
toast.info('提示訊息');

// 帶描述
toast.info('新功能上線', {
  description: '現在可以批次匯入報價了！',
});

// 帶連結
toast.info('系統更新', {
  description: '查看更新內容',
  action: {
    label: '了解更多',
    onClick: () => window.open('/changelog'),
  },
});
```

**範例**:
```typescript
// 顯示提示訊息
const showTip = () => {
  toast.info('小提示', {
    description: '您可以按住 Shift 鍵選擇多個項目',
  });
};
```

---

## 🎯 進階用法

### 1. 載入狀態

```typescript
// 顯示載入中
const toastId = toast.loading('正在處理...');

// 成功後更新
toast.success('處理完成！', { id: toastId });

// 或失敗後更新
toast.error('處理失敗', { id: toastId });
```

**範例**:
```typescript
const handleBatchImport = async (data: any[]) => {
  const toastId = toast.loading('正在匯入報價...');
  
  try {
    const response = await fetch(`${API_URL}/quotes/batch`, {
      method: 'POST',
      body: JSON.stringify({ quotes: data }),
    });
    
    if (response.ok) {
      const result = await response.json();
      toast.success(`成功匯入 ${result.created} 筆報價！`, { id: toastId });
    } else {
      toast.error('匯入失敗', { id: toastId });
    }
  } catch (error) {
    toast.error('匯入時發生錯誤', { id: toastId });
  }
};
```

---

### 2. Promise 處理

```typescript
// 自動處理 Promise 狀態
toast.promise(
  fetchData(),
  {
    loading: '載入中...',
    success: (data) => `成功載入 ${data.length} 筆資料`,
    error: '載入失敗',
  }
);
```

**範例**:
```typescript
const loadVendors = async () => {
  await toast.promise(
    fetch(`${API_URL}/vendors`).then(res => res.json()),
    {
      loading: '載入供應商資料...',
      success: (data) => `成功載入 ${data.length} 個供應商`,
      error: '載入供應商失敗',
    }
  );
};
```

---

### 3. 自定義持續時間

```typescript
// 短暫顯示（1秒）
toast.success('已複製', { duration: 1000 });

// 長時間顯示（10秒）
toast.error('嚴重錯誤', { duration: 10000 });

// 永久顯示（需手動關閉）
toast.info('重要通知', { duration: Infinity });
```

---

### 4. 自定義位置

在 App.tsx 中配置：

```typescript
<Toaster 
  position="top-right"  // 位置選項
  expand={false}        // 是否展開
  richColors           // 使用豐富的顏色
/>
```

**位置選項**:
- `top-left`
- `top-center`
- `top-right` ✅ (推薦)
- `bottom-left`
- `bottom-center`
- `bottom-right`

---

### 5. 關閉 Toast

```typescript
// 關閉特定 toast
const toastId = toast.success('操作成功');
toast.dismiss(toastId);

// 關閉所有 toast
toast.dismiss();
```

---

## 📋 完整範例

### 供應商管理範例

```typescript
import { toast } from 'sonner';

export function VendorsPage() {
  // 新增供應商
  const handleAddVendor = async (vendorData: any) => {
    const toastId = toast.loading('正在新增供應商...');
    
    try {
      const response = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newVendor = await response.json();
      setVendors([...vendors, newVendor]);
      
      toast.success('供應商新增成功！', {
        id: toastId,
        description: `已新增 ${newVendor.name}`,
      });
    } catch (error) {
      toast.error('新增供應商失敗', {
        id: toastId,
        description: '請稍後再試',
      });
    }
  };

  // 刪除供應商
  const handleDeleteVendor = async (id: string) => {
    if (!confirm('確定要刪除此供應商嗎？')) return;

    try {
      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVendors(vendors.filter(v => v.id !== id));
      toast.success('供應商已刪除');
    } catch (error) {
      toast.error('刪除供應商失敗', {
        description: '請檢查網路連線',
      });
    }
  };

  // 載入範例數據
  const loadSampleVendors = async () => {
    const toastId = toast.loading('正在載入範例數據...');
    
    try {
      // ... 批次新增邏輯
      
      toast.success(`示範數據已加載！`, {
        id: toastId,
        description: `成功新增 ${newVendors.length} 個供應商`,
      });
    } catch (error) {
      toast.error('載入範例數據失敗', {
        id: toastId,
      });
    }
  };
}
```

---

## 🎨 視覺效果預覽

### 成功訊息
```
┌─────────────────────────────────────┐
│ ✓ 供應商新增成功！                    │
│   已新增長榮海運                      │
└─────────────────────────────────────┘
背景: 淺綠色 | 文字: 深綠色 | 圖標: ✓
```

### 錯誤訊息
```
┌─────────────────────────────────────┐
│ ✕ 載入供應商失敗                      │
│   請檢查網路連線                      │
└─────────────────────────────────────┘
背景: 淺紅色 | 文字: 深紅色 | 圖標: ✕
```

### 警告訊息
```
┌─────────────────────────────────────┐
│ ⚠ 報價即將過期                        │
│   此報價將在 3 天後失效               │
└─────────────────────────────────────┘
背景: 淺黃色 | 文字: 深黃色 | 圖標: ⚠
```

### 資訊訊息
```
┌─────────────────────────────────────┐
│ ℹ 新功能上線                          │
│   現在可以批次匯入報價了！            │
└─────────────────────────────────────┘
背景: 淺藍色 | 文字: 深藍色 | 圖標: ℹ
```

---

## 🔧 配置檔案

### src/components/ui/sonner.tsx

```typescript
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          // 成功訊息 - 綠色
          success: "!bg-green-50 !text-green-900 !border-green-200",
          // 錯誤訊息 - 紅色
          error: "!bg-red-50 !text-red-900 !border-red-200",
          // 警告訊息 - 黃色
          warning: "!bg-yellow-50 !text-yellow-900 !border-yellow-200",
          // 資訊訊息 - 藍色
          info: "!bg-blue-50 !text-blue-900 !border-blue-200",
        },
      }}
      {...props}
    />
  );
};
```

---

## 💡 最佳實踐

### 1. 訊息要簡潔明確
```typescript
// ✅ 好
toast.success('供應商新增成功！');

// ❌ 不好
toast.success('您的供應商資料已經成功新增到資料庫中了！');
```

### 2. 使用描述提供更多資訊
```typescript
// ✅ 好
toast.success('批次匯入完成', {
  description: `成功匯入 ${count} 筆報價`,
});

// ❌ 不好
toast.success(`批次匯入完成，成功匯入 ${count} 筆報價`);
```

### 3. 錯誤訊息要有幫助
```typescript
// ✅ 好
toast.error('載入失敗', {
  description: '請檢查網路連線後重試',
});

// ❌ 不好
toast.error('錯誤');
```

### 4. 適當使用載入狀態
```typescript
// ✅ 好 - 長時間操作顯示載入
const toastId = toast.loading('正在處理...');
await longRunningOperation();
toast.success('完成！', { id: toastId });

// ❌ 不好 - 快速操作不需要載入
const toastId = toast.loading('正在儲存...');
localStorage.setItem('key', 'value');
toast.success('完成！', { id: toastId });
```

### 5. 選擇正確的類型
```typescript
// ✅ 成功 - 操作完成
toast.success('報價已儲存');

// ✅ 錯誤 - 操作失敗
toast.error('儲存失敗');

// ✅ 警告 - 需要注意但不是錯誤
toast.warning('報價即將過期');

// ✅ 資訊 - 一般提示
toast.info('您可以按 Ctrl+S 快速儲存');
```

---

## 🔗 相關資源

- [Sonner 官方文檔](https://sonner.emilkowal.ski/)
- [Tailwind CSS 顏色](https://tailwindcss.com/docs/customizing-colors)
- [專案 UI 組件](../src/components/ui/)

---

**享受美觀的 Toast 通知！** 🎉

