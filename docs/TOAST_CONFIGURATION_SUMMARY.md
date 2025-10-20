# 🎨 Toast Notification 配置總結

## ✅ 已完成的工作

### 1. 顏色主題配置

已在 `src/components/ui/sonner.tsx` 中配置了四種顏色主題：

| 類型 | 背景色 | 文字色 | 邊框色 | 使用場景 |
|------|--------|--------|--------|----------|
| **Success** ✅ | `bg-green-50` | `text-green-900` | `border-green-200` | 操作成功、新增/更新/刪除成功 |
| **Error** ❌ | `bg-red-50` | `text-red-900` | `border-red-200` | 操作失敗、API 錯誤、驗證失敗 |
| **Warning** ⚠️ | `bg-yellow-50` | `text-yellow-900` | `border-yellow-200` | 警告訊息、即將過期、需要注意 |
| **Info** ℹ️ | `bg-blue-50` | `text-blue-900` | `border-blue-200` | 一般提示、新功能、使用說明 |

---

### 2. 替換所有 alert()

已將所有瀏覽器原生 `alert()` 替換為 `toast` 通知：

#### 修改的檔案（3個）

1. **src/pages/VendorsPage.tsx**
   - ✅ 新增 `import { toast } from 'sonner'`
   - ✅ 6 個 alert 替換為 toast
   - 載入失敗、新增、更新、刪除、載入範例

2. **src/pages/QuotesPage.tsx**
   - ✅ 新增 `import { toast } from 'sonner'`
   - ✅ 8 個 alert 替換為 toast
   - 新增、更新、刪除、批次匯入、載入範例

3. **src/components/VendorSelection.tsx**
   - ✅ 新增 `import { toast } from 'sonner'`
   - ✅ 3 個 alert 替換為 toast
   - 驗證、發送成功、發送失敗

**總計**: 17 個 `alert()` 全部替換為 `toast`

---

### 3. 創建的文檔

#### docs/TOAST_USAGE.md
完整的 Toast 使用指南，包含：
- 🎨 顏色主題說明
- 📖 基本使用方法
- 🎯 進階功能（loading、promise、action）
- 💡 最佳實踐
- 📋 完整範例代碼

#### src/pages/ToastTestPage.tsx
測試頁面（供開發使用），包含：
- 所有 Toast 類型的測試按鈕
- 進階功能測試
- 顏色預覽
- 使用說明

---

## 📝 配置代碼

### src/components/ui/sonner.tsx

```typescript
import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-600",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          // 成功訊息 - 綠色
          success: "group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-900 group-[.toaster]:!border-green-200",
          // 錯誤訊息 - 紅色
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200",
          // 警告訊息 - 黃色
          warning: "group-[.toaster]:!bg-yellow-50 group-[.toaster]:!text-yellow-900 group-[.toaster]:!border-yellow-200",
          // 資訊訊息 - 藍色
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-900 group-[.toaster]:!border-blue-200",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
```

---

## 🎯 使用範例

### 1. 成功訊息

```typescript
import { toast } from 'sonner';

// 基本用法
toast.success('供應商新增成功！');

// 帶描述
toast.success('供應商新增成功！', {
  description: '已成功新增供應商資料到資料庫',
});
```

### 2. 錯誤訊息

```typescript
// 基本用法
toast.error('新增供應商失敗');

// 帶描述
toast.error('載入資料失敗', {
  description: '請檢查網路連線後重試',
});
```

### 3. 警告訊息

```typescript
// 基本用法
toast.warning('報價即將過期');

// 帶描述
toast.warning('資料即將過期', {
  description: '此報價將在 3 天後失效',
});
```

### 4. 資訊訊息

```typescript
// 基本用法
toast.info('新功能上線');

// 帶描述
toast.info('新功能上線', {
  description: '現在可以批次匯入報價了！',
});
```

### 5. 載入狀態

```typescript
const toastId = toast.loading('正在處理...');

// 成功後更新
toast.success('處理完成！', { id: toastId });

// 或失敗後更新
toast.error('處理失敗', { id: toastId });
```

---

## 📊 替換統計

### 之前（alert）
- ❌ 阻塞 UI
- ❌ 樣式醜陋
- ❌ 無法自動消失
- ❌ 無法顯示多個通知
- ❌ 無法自定義樣式

### 現在（toast）
- ✅ 非阻塞 UI
- ✅ 美觀的設計
- ✅ 自動消失（3-4秒）
- ✅ 可堆疊顯示
- ✅ 支援不同類型（success/error/warning/info）
- ✅ 可自定義位置和樣式
- ✅ 支援動作按鈕
- ✅ 支援 Promise 自動處理

---

## 🎨 視覺效果

### 成功訊息（綠色）
```
┌─────────────────────────────────────┐
│ ✓ 供應商新增成功！                    │
│   已新增長榮海運                      │
└─────────────────────────────────────┘
```

### 錯誤訊息（紅色）
```
┌─────────────────────────────────────┐
│ ✕ 載入供應商失敗                      │
│   請檢查網路連線                      │
└─────────────────────────────────────┘
```

### 警告訊息（黃色）
```
┌─────────────────────────────────────┐
│ ⚠ 報價即將過期                        │
│   此報價將在 3 天後失效               │
└─────────────────────────────────────┘
```

### 資訊訊息（藍色）
```
┌─────────────────────────────────────┐
│ ℹ 新功能上線                          │
│   現在可以批次匯入報價了！            │
└─────────────────────────────────────┘
```

---

## 🧪 測試方法

### 方法 1: 使用測試頁面（推薦）

1. 在 App.tsx 中臨時添加測試頁面路由
2. 訪問測試頁面
3. 點擊各種按鈕測試所有 Toast 類型

### 方法 2: 在現有頁面測試

1. 訪問供應商管理頁面
2. 嘗試新增/更新/刪除供應商
3. 觀察 Toast 通知效果

### 方法 3: 瀏覽器控制台

```javascript
// 在瀏覽器控制台執行
toast.success('測試成功訊息');
toast.error('測試錯誤訊息');
toast.warning('測試警告訊息');
toast.info('測試資訊訊息');
```

---

## 📁 相關檔案

### 配置檔案
- `src/components/ui/sonner.tsx` - Toast 組件配置
- `src/App.tsx` - Toaster 組件引入

### 使用檔案
- `src/pages/VendorsPage.tsx` - 供應商管理
- `src/pages/QuotesPage.tsx` - 報價管理
- `src/components/VendorSelection.tsx` - 供應商選擇

### 文檔檔案
- `docs/TOAST_USAGE.md` - 完整使用指南
- `docs/README.md` - 文檔索引（已更新）

### 測試檔案
- `src/pages/ToastTestPage.tsx` - 測試頁面

---

## ✨ 特色功能

### 1. 自動消失
Toast 會在 3-4 秒後自動消失，無需手動關閉

### 2. 堆疊顯示
可以同時顯示多個 Toast，自動堆疊排列

### 3. 動作按鈕
可以在 Toast 中添加動作按鈕

```typescript
toast.success('報價已儲存', {
  action: {
    label: '查看',
    onClick: () => console.log('查看報價'),
  },
});
```

### 4. Promise 處理
自動處理 Promise 的 loading/success/error 狀態

```typescript
toast.promise(
  fetchData(),
  {
    loading: '載入中...',
    success: (data) => `成功載入 ${data.length} 筆資料`,
    error: '載入失敗',
  }
);
```

### 5. 自定義持續時間

```typescript
// 短暫顯示（1秒）
toast.success('已複製', { duration: 1000 });

// 長時間顯示（10秒）
toast.error('嚴重錯誤', { duration: 10000 });
```

---

## 🎯 最佳實踐

### 1. 訊息要簡潔明確
✅ `toast.success('供應商新增成功！')`  
❌ `toast.success('您的供應商資料已經成功新增到資料庫中了！')`

### 2. 使用描述提供更多資訊
✅ 主要訊息簡短，詳細資訊放在描述中  
❌ 把所有資訊都塞在主要訊息中

### 3. 錯誤訊息要有幫助
✅ `toast.error('載入失敗', { description: '請檢查網路連線後重試' })`  
❌ `toast.error('錯誤')`

### 4. 選擇正確的類型
- **Success**: 操作成功完成
- **Error**: 操作失敗或發生錯誤
- **Warning**: 需要注意但不是錯誤
- **Info**: 一般提示或資訊

---

## 🔗 相關資源

- [Sonner 官方文檔](https://sonner.emilkowal.ski/)
- [Tailwind CSS 顏色](https://tailwindcss.com/docs/customizing-colors)
- [專案開發規範](.cursorrules)

---

**所有通知現在都使用美觀的 Toast notification 了！** 🎉

