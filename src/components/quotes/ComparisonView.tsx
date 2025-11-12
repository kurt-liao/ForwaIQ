import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import type { Quote } from '../../App';

interface ComparisonViewProps {
  quotes: Quote[];
}

export function ComparisonView({ quotes }: ComparisonViewProps) {
  const [sortBy, setSortBy] = useState<'price' | 'validUntil'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 計算報價總價（轉換為 TWD 後相加）
  const getQuoteTotal = (quote: Quote) => {
    if (!quote.lineItems || quote.lineItems.length === 0) return 0;
    return quote.lineItems.reduce((sum, item) => {
      const rate = { TWD: 1, USD: 31, CNY: 4.3, EUR: 33.5 }[item.currency] || 1;
      return sum + item.cost * rate;
    }, 0);
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'price') {
      const priceA = getQuoteTotal(a);
      const priceB = getQuoteTotal(b);
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    } else {
      const dateA = new Date(a.validUntil).getTime();
      const dateB = new Date(b.validUntil).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  const avgPrice = quotes.length > 0
    ? quotes.reduce((sum, q) => sum + getQuoteTotal(q), 0) / quotes.length
    : 0;

  const minPrice = quotes.length > 0 ? Math.min(...quotes.map(q => getQuoteTotal(q))) : 0;
  const maxPrice = quotes.length > 0 ? Math.max(...quotes.map(q => getQuoteTotal(q))) : 0;

  const toggleSort = (field: 'price' | 'validUntil') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        沒有可比較的報價
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">最低價格</div>
          <div className="text-2xl text-green-900">${minPrice.toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 mb-1">平均價格</div>
          <div className="text-2xl text-blue-900">${avgPrice.toFixed(0).toLocaleString()}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-600 mb-1">最高價格</div>
          <div className="text-2xl text-orange-900">${maxPrice.toLocaleString()}</div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleSort('price')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            sortBy === 'price'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          按價格排序
          {sortBy === 'price' && (
            sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => toggleSort('validUntil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            sortBy === 'validUntil'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          按有效期排序
          {sortBy === 'validUntil' && (
            sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-gray-600">排名</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">廠商</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">路線/服務</th>
              <th className="px-4 py-3 text-right text-sm text-gray-600">價格</th>
              <th className="px-4 py-3 text-right text-sm text-gray-600">與平均價差</th>
              <th className="px-4 py-3 text-right text-sm text-gray-600">有效期限</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedQuotes.map((quote, index) => {
              const quoteTotal = getQuoteTotal(quote);
              const priceDiff = quoteTotal - avgPrice;
              const diffPercent = avgPrice > 0 ? ((priceDiff / avgPrice) * 100).toFixed(1) : '0';
              const isLowest = quoteTotal === minPrice;
              
              return (
                <tr key={quote.id} className={isLowest ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    {isLowest && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs">
                        ★
                      </span>
                    )}
                    {!isLowest && (
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{quote.vendorName}</div>
                    <div className="text-xs text-gray-500">
                      {quote.vendorType === 'shipping' && '海運'}
                      {quote.vendorType === 'trucking' && '拖車'}
                      {quote.vendorType === 'customs' && '報關'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">
                      {quote.origin && quote.destination && (
                        <>{quote.origin} → {quote.destination}</>
                      )}
                      {quote.pickupLocation && quote.deliveryLocation && (
                        <>{quote.pickupLocation} → {quote.deliveryLocation}</>
                      )}
                      {quote.customsType && <>{quote.customsType}</>}
                    </div>
                    {quote.containerSize && (
                      <div className="text-xs text-gray-500">{quote.containerSize}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        const currencies = [...new Set(quote.lineItems?.map(item => item.currency) || [])];
                        const currency = currencies.length === 1 ? currencies[0] : 'USD';
                        return `${currency} $${quoteTotal.toLocaleString()}`;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`text-sm ${
                      priceDiff < 0 ? 'text-green-600' : priceDiff > 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {priceDiff > 0 ? '+' : ''}{diffPercent}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
