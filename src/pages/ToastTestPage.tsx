import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Toast 測試頁面 - 用於展示和測試所有 Toast 類型
 * 
 * 此頁面僅供開發測試使用，不應在生產環境中顯示
 */
export function ToastTestPage() {
  const handleSuccessToast = () => {
    toast.success('操作成功！');
  };

  const handleSuccessWithDescription = () => {
    toast.success('供應商新增成功！', {
      description: '已成功新增供應商資料到資料庫',
    });
  };

  const handleErrorToast = () => {
    toast.error('操作失敗！');
  };

  const handleErrorWithDescription = () => {
    toast.error('載入資料失敗', {
      description: '請檢查網路連線後重試',
    });
  };

  const handleWarningToast = () => {
    toast.warning('請注意！');
  };

  const handleWarningWithDescription = () => {
    toast.warning('資料即將過期', {
      description: '此報價將在 3 天後失效',
    });
  };

  const handleInfoToast = () => {
    toast.info('提示訊息');
  };

  const handleInfoWithDescription = () => {
    toast.info('新功能上線', {
      description: '現在可以批次匯入報價了！',
    });
  };

  const handleLoadingToast = () => {
    const toastId = toast.loading('正在處理中...');
    
    // 模擬 3 秒後完成
    setTimeout(() => {
      toast.success('處理完成！', { id: toastId });
    }, 3000);
  };

  const handlePromiseToast = () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve({ count: 10 }), 3000);
    });

    toast.promise(promise, {
      loading: '載入中...',
      success: (data: any) => `成功載入 ${data.count} 筆資料`,
      error: '載入失敗',
    });
  };

  const handleWithAction = () => {
    toast.success('報價已儲存', {
      action: {
        label: '查看',
        onClick: () => console.log('查看報價'),
      },
    });
  };

  const handleMultipleToasts = () => {
    toast.success('第一個通知');
    setTimeout(() => toast.info('第二個通知'), 500);
    setTimeout(() => toast.warning('第三個通知'), 1000);
    setTimeout(() => toast.error('第四個通知'), 1500);
  };

  const handleDismissAll = () => {
    toast.dismiss();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎨 Toast 通知測試頁面
          </h1>
          <p className="text-gray-600">
            測試所有 Toast 通知類型和功能
          </p>
        </div>

        {/* 基本類型 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            基本類型
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 成功 */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">✅ 成功訊息（綠色）</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleSuccessToast}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  基本成功訊息
                </Button>
                <Button 
                  onClick={handleSuccessWithDescription}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  帶描述的成功訊息
                </Button>
              </div>
            </div>

            {/* 錯誤 */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">❌ 錯誤訊息（紅色）</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleErrorToast}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  基本錯誤訊息
                </Button>
                <Button 
                  onClick={handleErrorWithDescription}
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                >
                  帶描述的錯誤訊息
                </Button>
              </div>
            </div>

            {/* 警告 */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">⚠️ 警告訊息（黃色）</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleWarningToast}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  基本警告訊息
                </Button>
                <Button 
                  onClick={handleWarningWithDescription}
                  variant="outline"
                  className="w-full border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                >
                  帶描述的警告訊息
                </Button>
              </div>
            </div>

            {/* 資訊 */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">ℹ️ 資訊訊息（藍色）</h3>
              <div className="space-y-2">
                <Button 
                  onClick={handleInfoToast}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  基本資訊訊息
                </Button>
                <Button 
                  onClick={handleInfoWithDescription}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  帶描述的資訊訊息
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 進階功能 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-purple-600" />
            進階功能
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleLoadingToast}
              variant="outline"
              className="w-full"
            >
              載入狀態 Toast（3秒後完成）
            </Button>
            
            <Button 
              onClick={handlePromiseToast}
              variant="outline"
              className="w-full"
            >
              Promise Toast（自動處理狀態）
            </Button>
            
            <Button 
              onClick={handleWithAction}
              variant="outline"
              className="w-full"
            >
              帶動作按鈕的 Toast
            </Button>
            
            <Button 
              onClick={handleMultipleToasts}
              variant="outline"
              className="w-full"
            >
              多個 Toast（堆疊顯示）
            </Button>
          </div>
        </div>

        {/* 控制功能 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-600" />
            控制功能
          </h2>
          
          <Button 
            onClick={handleDismissAll}
            variant="destructive"
            className="w-full"
          >
            關閉所有 Toast
          </Button>
        </div>

        {/* 顏色預覽 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎨 顏色預覽
          </h2>
          
          <div className="space-y-3">
            {/* 成功 */}
            <div className="flex items-center gap-3 p-3 bg-green-50 text-green-900 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <div className="font-medium">成功訊息</div>
                <div className="text-sm text-green-700">背景: green-50 | 文字: green-900 | 邊框: green-200</div>
              </div>
            </div>

            {/* 錯誤 */}
            <div className="flex items-center gap-3 p-3 bg-red-50 text-red-900 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5" />
              <div>
                <div className="font-medium">錯誤訊息</div>
                <div className="text-sm text-red-700">背景: red-50 | 文字: red-900 | 邊框: red-200</div>
              </div>
            </div>

            {/* 警告 */}
            <div className="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <div className="font-medium">警告訊息</div>
                <div className="text-sm text-yellow-700">背景: yellow-50 | 文字: yellow-900 | 邊框: yellow-200</div>
              </div>
            </div>

            {/* 資訊 */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5" />
              <div>
                <div className="font-medium">資訊訊息</div>
                <div className="text-sm text-blue-700">背景: blue-50 | 文字: blue-900 | 邊框: blue-200</div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📖 使用說明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 點擊按鈕測試不同類型的 Toast 通知</li>
            <li>• Toast 會在 3-4 秒後自動消失</li>
            <li>• 可以同時顯示多個 Toast（堆疊顯示）</li>
            <li>• 詳細使用方法請參考 <code className="bg-blue-100 px-1 rounded">docs/TOAST_USAGE.md</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

