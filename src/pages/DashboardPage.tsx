import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Clock, AlertCircle } from 'lucide-react';
import type { Quote, Vendor } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotesRes, vendorsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/quotes`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/vendors`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }),
      ]);

      const quotesData = await quotesRes.json();
      const vendorsData = await vendorsRes.json();

      setQuotes(quotesData);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const validQuotes = quotes.filter(q => new Date(q.validUntil) > now);
  const expiredQuotes = quotes.filter(q => new Date(q.validUntil) <= now);
  
  const expiringSoon = quotes.filter(q => {
    const daysUntil = (new Date(q.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 7;
  });

  const avgPrice = quotes.length > 0 
    ? quotes.reduce((sum, q) => sum + q.price, 0) / quotes.length 
    : 0;

  const newVendorsThisMonth = vendors.filter(v => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(v.createdAt) > monthAgo;
  }).length;

  const typeDistribution = [
    { name: '海運', value: quotes.filter(q => q.vendorType === 'shipping').length, color: 'bg-blue-600' },
    { name: '拖車', value: quotes.filter(q => q.vendorType === 'trucking').length, color: 'bg-green-600' },
    { name: '報關', value: quotes.filter(q => q.vendorType === 'customs').length, color: 'bg-orange-600' },
  ];

  const topVendors = Object.entries(
    quotes.reduce((acc, quote) => {
      acc[quote.vendorName] = (acc[quote.vendorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const getDaysUntilExpiry = (validUntil: string) => {
    return Math.ceil((new Date(validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-gray-900">數據儀表板</h1>
              <p className="text-sm text-gray-500">報價數據總覽與分析</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">總報價數</div>
              <Package className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl text-gray-900">{quotes.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              有效: {validQuotes.length} | 過期: {expiredQuotes.length}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">平均價格</div>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl text-gray-900">${avgPrice.toFixed(0)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              較上月降低 3.2%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">供應商總數</div>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl text-gray-900">{vendors.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              本月新增 {newVendorsThisMonth} 家
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">即將到期</div>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl text-orange-600">{expiringSoon.length}</div>
            <p className="text-xs text-gray-500 mt-1">7天內到期需更新</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Type Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">報價類型分布</h3>
            <div className="space-y-3">
              {typeDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <div className="flex-1">{item.name}</div>
                  <div className="text-gray-600">{item.value}</div>
                  <div className="text-sm text-gray-500">
                    {quotes.length > 0 ? ((item.value / quotes.length) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-4">最常合作供應商 (Top 5)</h3>
            <div className="space-y-3">
              {topVendors.map((vendor) => (
                <div key={vendor.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{vendor.name}</span>
                    <span className="text-gray-600">{vendor.count} 筆</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(vendor.count / (topVendors[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {expiringSoon.length > 0 && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
            <div className="flex items-center gap-2 text-orange-800 mb-4">
              <AlertCircle className="w-5 h-5" />
              <h3>需要注意的報價</h3>
            </div>
            <div className="space-y-2">
              {expiringSoon.slice(0, 5).map((quote) => (
                <div key={quote.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-900">{quote.vendorName}</div>
                    {quote.origin && quote.destination && (
                      <div className="text-xs text-gray-500">
                        {quote.origin} → {quote.destination}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{quote.currency} ${quote.price}</div>
                    <div className="text-xs text-orange-600">
                      {getDaysUntilExpiry(quote.validUntil)} 天後到期
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
