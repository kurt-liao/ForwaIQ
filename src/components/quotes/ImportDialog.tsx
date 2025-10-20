import { useState } from 'react';
import { X, FileSpreadsheet, Mail, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (quotes: any[]) => Promise<void>;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'email'>('excel');
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [emailText, setEmailText] = useState('');

  const downloadTemplate = () => {
    const template = [
      ['廠商類型', '廠商名稱', '價格', '幣別', '有效期限', '起運港', '目的港', '船公司', '航程時間', '櫃型', '取貨地點', '送達地點', '車型', '報關類型', '產品類別', '備註'],
      ['shipping', '長榮海運', '1200', 'USD', '2025-12-31', '基隆港', '寧波港', 'EVERGREEN', '3-5天', '40HQ', '', '', '', '', '', '含基本港雜費'],
      ['trucking', '台灣拖車', '3500', 'TWD', '2025-12-31', '', '', '', '', '', '桃園龜山', '基隆港', '40ft', '', '', '24小時服務'],
      ['customs', '佳鑫報關行', '2500', 'TWD', '2025-12-31', '', '', '', '', '', '', '', '', '出口報關', '電子產品', '含簽審文件'],
    ];

    const csv = template.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '報價匯入模板.csv';
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const Papa = await import('papaparse');
    
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (results: any) => {
        const { data, errors: parseErrors } = results;
        
        if (parseErrors.length > 0) {
          setErrors(parseErrors.map((e: any) => `行 ${e.row}: ${e.message}`));
          return;
        }

        const { quotes, validationErrors } = validateAndTransformData(data);
        
        setErrors(validationErrors);
        setPreviewData(quotes);
      },
      error: (error: any) => {
        setErrors([`文件解析失敗: ${error.message}`]);
      },
    });
  };

  const validateAndTransformData = (data: any[]) => {
    const quotes: any[] = [];
    const validationErrors: string[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      const vendorType = (row['廠商類型'] || row['vendorType'] || '').toLowerCase();
      const vendorName = row['廠商名稱'] || row['vendorName'] || '';
      const price = parseFloat((row['價格'] || row['price'] || '').toString().replace(/,/g, ''));
      const currency = row['幣別'] || row['currency'] || 'USD';
      const validUntil = row['有效期限'] || row['validUntil'] || '';

      if (!vendorType || !['shipping', 'trucking', 'customs'].includes(vendorType)) {
        validationErrors.push(`行 ${rowNum}: 廠商類型無效`);
        return;
      }

      if (!vendorName) {
        validationErrors.push(`行 ${rowNum}: 缺少廠商名稱`);
        return;
      }

      if (isNaN(price) || price <= 0) {
        validationErrors.push(`行 ${rowNum}: 價格無效`);
        return;
      }

      if (!validUntil) {
        validationErrors.push(`行 ${rowNum}: 缺少有效期限`);
        return;
      }

      const quote: any = {
        vendorType,
        vendorName,
        price,
        currency,
        validUntil,
      };

      if (vendorType === 'shipping') {
        quote.origin = row['起運港'] || row['origin'] || '';
        quote.destination = row['目的港'] || row['destination'] || '';
        quote.carrier = row['船公司'] || row['carrier'] || '';
        quote.transitTime = row['航程時間'] || row['transitTime'] || '';
        quote.containerSize = row['櫃型'] || row['containerSize'] || '';
      } else if (vendorType === 'trucking') {
        quote.pickupLocation = row['取貨地點'] || row['pickupLocation'] || '';
        quote.deliveryLocation = row['送達地點'] || row['deliveryLocation'] || '';
        quote.truckType = row['車型'] || row['truckType'] || '';
      } else if (vendorType === 'customs') {
        quote.customsType = row['報關類型'] || row['customsType'] || '';
        quote.productCategory = row['產品類別'] || row['productCategory'] || '';
      }

      quote.notes = row['備註'] || row['notes'] || '';

      quotes.push(quote);
    });

    return { quotes, validationErrors };
  };

  const parseEmailText = () => {
    const lines = emailText.split('\n').filter(line => line.trim());
    const quotes: any[] = [];
    const validationErrors: string[] = [];

    const pricePattern = /(?:USD|TWD|CNY|EUR)?\s*[\$]?\s*(\d{1,}(?:,\d{3})*(?:\.\d{2})?)/i;
    const routePattern = /([^\s]+(?:港|Port))\s*(?:to|→|->|至)\s*([^\s]+(?:港|Port))/i;
    const vendorPattern = /(?:廠商|供應商|Vendor|Company)[:：]\s*(.+)/i;

    let currentQuote: any = {
      vendorType: 'shipping',
      currency: 'USD',
    };

    lines.forEach((line) => {
      const vendorMatch = line.match(vendorPattern);
      if (vendorMatch) {
        currentQuote.vendorName = vendorMatch[1].trim();
      }

      const routeMatch = line.match(routePattern);
      if (routeMatch) {
        currentQuote.origin = routeMatch[1].trim();
        currentQuote.destination = routeMatch[2].trim();
      }

      const priceMatch = line.match(pricePattern);
      if (priceMatch) {
        const currencyMatch = line.match(/(USD|TWD|CNY|EUR)/i);
        if (currencyMatch) {
          currentQuote.currency = currencyMatch[1].toUpperCase();
        }
        currentQuote.price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }

      if (line.match(/20GP|40GP|40HQ|45HQ/)) {
        const containerMatch = line.match(/(20GP|40GP|40HQ|45HQ)/);
        if (containerMatch) {
          currentQuote.containerSize = containerMatch[1];
        }
      }
    });

    currentQuote.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (currentQuote.vendorName && currentQuote.price) {
      quotes.push(currentQuote);
    } else {
      validationErrors.push('無法從郵件中提取完整的報價資訊。請確保包含廠商名稱和價格。');
    }

    setErrors(validationErrors);
    setPreviewData(quotes);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setImporting(true);
    try {
      await onImport(previewData);
      onOpenChange(false);
      setPreviewData([]);
      setErrors([]);
      setEmailText('');
    } catch (error) {
      setErrors([`匯入失敗: ${error}`]);
    } finally {
      setImporting(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setPreviewData([]);
    setErrors([]);
    setEmailText('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl text-gray-900">批次匯入報價</h2>
            <p className="text-sm text-gray-500 mt-1">從 Excel/CSV 文件或郵件內容快速匯入多筆報價</p>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('excel')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'excel'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                Excel/CSV 匯入
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'email'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                郵件文字解析
              </button>
            </div>
          </div>

          {/* Excel Tab */}
          {activeTab === 'excel' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="bg-blue-50 p-4 rounded-full inline-block mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-gray-900 mb-2">上傳 Excel 或 CSV 文件</h4>
                <p className="text-sm text-gray-500 mb-4">支援 .csv, .xlsx 格式，建議先下載模板填寫</p>
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    下載 CSV 模板
                  </Button>
                  
                  <label>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      選擇文件
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 mt-4">
                  <p>必填欄位: 廠商類型、廠商名稱、價格、幣別、有效期限</p>
                  <p>廠商類型: shipping (海運) / trucking (拖車) / customs (報關)</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">貼上郵件內容</label>
                <Textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="將報價郵件內容貼在這裡...&#10;&#10;範例:&#10;廠商: 長榮海運&#10;基隆港 → 寧波港&#10;40HQ USD $1,200&#10;航程: 3-5天"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button
                onClick={parseEmailText}
                disabled={!emailText.trim()}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                解析郵件內容
              </Button>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    AI 解析功能會嘗試從郵件文字中提取報價資訊。由於郵件格式多樣，建議解析後檢查預覽資料。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">發現 {errors.length} 個錯誤:</div>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {errors.length > 5 && <li>... 還有 {errors.length - 5} 個錯誤</li>}
              </ul>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <CheckCircle className="w-4 h-4" />
                <span>預覽 {previewData.length} 筆報價</span>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {previewData.map((quote, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-900">{quote.vendorName}</span>
                        <span className="text-gray-500 ml-2">
                          {quote.vendorType === 'shipping' ? '海運' : quote.vendorType === 'trucking' ? '拖車' : '報關'}
                        </span>
                      </div>
                      <div className="text-gray-900">
                        {quote.currency} ${quote.price?.toLocaleString()}
                      </div>
                    </div>
                    {quote.origin && quote.destination && (
                      <div className="text-xs text-gray-500 mt-1">
                        {quote.origin} → {quote.destination}
                        {quote.containerSize && ` (${quote.containerSize})`}
                      </div>
                    )}
                    {quote.pickupLocation && quote.deliveryLocation && (
                      <div className="text-xs text-gray-500 mt-1">
                        {quote.pickupLocation} → {quote.deliveryLocation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-6">
            <Button variant="outline" onClick={close}>
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={previewData.length === 0 || errors.length > 0 || importing}
            >
              {importing ? '匯入中...' : `確認匯入 ${previewData.length} 筆`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
