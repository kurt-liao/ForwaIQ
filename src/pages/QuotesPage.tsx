import { useState, useEffect } from 'react';
import { Database, Plus, Upload } from 'lucide-react';
import type { Quote, FilterState } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { QuoteList } from '../components/quotes/QuoteList';
import { QuoteFilters } from '../components/quotes/QuoteFilters';
import { ComparisonView } from '../components/quotes/ComparisonView';
import { AddQuoteDialog } from '../components/quotes/AddQuoteDialog';
import { ImportDialog } from '../components/quotes/ImportDialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { calculateTotalTWD } from '../utils/currency';

interface QuotesPageProps {
  urlParams?: Record<string, string>;
}

export function QuotesPage({ urlParams }: QuotesPageProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'comparison'>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    vendorType: 'all',
    origin: '',
    destination: '',
    containerSize: '',
    minPrice: '',
    maxPrice: '',
    searchTerm: '',
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  // Handle URL path for editing quotes
  const checkForQuoteToEdit = () => {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);

    // Check if path is /quotes/{id}
    if (pathParts.length === 2 && pathParts[0] === 'quotes' && quotes.length > 0 && !isAddDialogOpen) {
      const editId = pathParts[1];
      console.log('Checking for quote to edit:', editId, 'quotes loaded:', quotes.length);
      const quoteToEdit = quotes.find(q => q.id.toString() === editId);
      if (quoteToEdit) {
        console.log('Found quote to edit:', quoteToEdit);
        setEditingQuote(quoteToEdit);
        setIsAddDialogOpen(true);
        // Clear the edit path after opening the dialog
        setTimeout(() => {
          window.history.replaceState(null, '', '/quotes');
        }, 100);
      } else {
        console.log('Quote not found for id:', editId);
        console.log('Available quotes:', quotes.map(q => q.id));
      }
    }
  };

  useEffect(() => {
    checkForQuoteToEdit();
  }, [quotes]); // Check when quotes load

  // Check for quote to edit on page load or navigation
  useEffect(() => {
    checkForQuoteToEdit();
  }, []); // Check on component mount

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('成功載入報價:', data);
        setQuotes(data);
      } else {
        console.error('載入報價失敗:', response.status);
      }
    } catch (error) {
      console.error('載入報價時發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 計算報價總價（轉換為 TWD 後相加）
  const getQuoteTotal = (quote: Quote) => {
    if (!quote.lineItems || quote.lineItems.length === 0) return 0;
    return calculateTotalTWD(quote.lineItems);
  };

  const filteredQuotes = quotes.filter((quote) => {
    if (filters.vendorType !== 'all' && quote.vendorType !== filters.vendorType) return false;
    if (filters.origin && quote.origin && !quote.origin.toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && quote.destination && !quote.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.containerSize && quote.containerSize !== filters.containerSize) return false;

    const totalPrice = getQuoteTotal(quote);
    if (filters.minPrice && totalPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && totalPrice > parseFloat(filters.maxPrice)) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        quote.vendorName.toLowerCase().includes(searchLower) ||
        quote.origin?.toLowerCase().includes(searchLower) ||
        quote.destination?.toLowerCase().includes(searchLower) ||
        quote.notes?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleAddQuote = async (quoteData: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quoteData),
        }
      );

      if (response.ok) {
        const newQuote = await response.json();
        console.log('報價新增成功:', newQuote);
        setQuotes([...quotes, newQuote]);
        setIsAddDialogOpen(false);
        setEditingQuote(null);
        toast.success('報價新增成功！');
      } else {
        const error = await response.json();
        console.error('新增報價失敗:', error);
        toast.error('新增報價失敗：' + (error.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('新增報價時發生錯誤:', error);
      toast.error('新增報價時發生錯誤');
    }
  };

  const handleUpdateQuote = async (quote: Quote) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes/${quote.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quote),
        }
      );

      if (response.ok) {
        const updatedQuote = await response.json();
        console.log('報價更新成功:', updatedQuote);
        setQuotes(quotes.map(q => q.id === quote.id ? updatedQuote : q));
        setIsAddDialogOpen(false);
        setEditingQuote(null);
        toast.success('報價更新成功！');
      } else {
        const error = await response.json();
        console.error('更新報價失敗:', error);
        toast.error('更新報價失敗：' + (error.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('更新報價時發生錯誤:', error);
      toast.error('更新報價時發生錯誤');
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('確定要刪除此報價嗎？')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        console.log('報價刪除成功');
        setQuotes(quotes.filter(q => q.id !== id));
        toast.success('報價已刪除');
      } else {
        const error = await response.json();
        console.error('刪除報價失敗:', error);
        toast.error('刪除報價失敗：' + (error.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('刪除報價時發生錯誤:', error);
      toast.error('刪除報價時發生錯誤');
    }
  };

  const handleBatchImport = async (quotesData: any[]) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes/batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quotes: quotesData }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('批次匯入成功:', result);
        await loadQuotes(); // 重新載入所有報價
        setIsImportDialogOpen(false);
        toast.success(`成功匯入 ${result.created} 筆報價！`);
      } else {
        const error = await response.json();
        console.error('批次匯入失敗:', error);
        toast.error('批次匯入失敗：' + (error.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('批次匯入時發生錯誤:', error);
      toast.error('批次匯入時發生錯誤');
    }
  };

  const loadSampleData = () => {
    const sampleQuotes = [
      {
        vendorName: '長榮海運',
        vendorType: 'shipping',
        price: 1200,
        currency: 'USD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        origin: '基隆港',
        destination: '寧波港',
        carrier: 'EVERGREEN',
        transitTime: '3-5天',
        containerSize: '40HQ',
        notes: '含基本港雜費',
      },
      {
        vendorName: '陽明海運',
        vendorType: 'shipping',
        price: 1150,
        currency: 'USD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        origin: '基隆港',
        destination: '寧波港',
        carrier: 'YANG MING',
        transitTime: '4-6天',
        containerSize: '40HQ',
        notes: '週三船期',
      },
      {
        vendorName: '萬海航運',
        vendorType: 'shipping',
        price: 1280,
        currency: 'USD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        origin: '基隆港',
        destination: '上海港',
        carrier: 'WAN HAI',
        transitTime: '3-4天',
        containerSize: '40HQ',
        notes: '直達船',
      },
      {
        vendorName: '台灣拖車',
        vendorType: 'trucking',
        price: 3500,
        currency: 'TWD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        pickupLocation: '桃園龜山',
        deliveryLocation: '基隆港',
        truckType: '40ft',
        notes: '24小時服務',
      },
    ];

    const newQuotes = sampleQuotes.map(quote => ({
      ...quote,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setQuotes(newQuotes);
    toast.success(`示範數據已加載！成功新增 ${newQuotes.length} 筆報價`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-gray-900">報價管理</h1>
                <p className="text-sm text-gray-500">集中管理、智能比較、快速決策</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                批次匯入
              </Button>
              <Button onClick={() => {
                setEditingQuote(null);
                setIsAddDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                新增報價
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {loading && (
          <div className="text-center py-12 text-gray-500">載入中...</div>
        )}

        {!loading && quotes.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-700 mb-2">尚無報價資料</h3>
            <p className="text-sm text-gray-500 mb-6">開始新增報價，建立您的報價資料庫</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                新增第一筆報價
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                Excel 批次匯入
              </Button>
              <Button variant="outline" onClick={loadSampleData}>
                載入範例資料
              </Button>
            </div>
          </div>
        )}

        {!loading && quotes.length > 0 && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`px-6 py-3 text-sm border-b-2 transition-colors ${
                      activeTab === 'list'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    報價列表
                  </button>
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-6 py-3 text-sm border-b-2 transition-colors ${
                      activeTab === 'comparison'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    價格比較
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'list' && (
                  <div className="space-y-6">
                    <QuoteFilters filters={filters} setFilters={setFilters} />

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">總報價數</div>
                        <div className="text-2xl text-gray-900 mt-1">{quotes.length}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">篩選結果</div>
                        <div className="text-2xl text-gray-900 mt-1">{filteredQuotes.length}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">海運報價</div>
                        <div className="text-2xl text-gray-900 mt-1">
                          {quotes.filter(q => q.vendorType === 'shipping').length}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">拖車報價</div>
                        <div className="text-2xl text-gray-900 mt-1">
                          {quotes.filter(q => q.vendorType === 'trucking').length}
                        </div>
                      </div>
                    </div>

                    <QuoteList
                      quotes={filteredQuotes}
                      onEdit={(quote) => {
                        setEditingQuote(quote);
                        setIsAddDialogOpen(true);
                      }}
                      onDelete={handleDeleteQuote}
                    />
                  </div>
                )}

                {activeTab === 'comparison' && (
                  <ComparisonView quotes={filteredQuotes} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddQuoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        editingQuote={editingQuote}
        onSubmit={editingQuote ? handleUpdateQuote : handleAddQuote}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleBatchImport}
      />
    </div>
  );
}
