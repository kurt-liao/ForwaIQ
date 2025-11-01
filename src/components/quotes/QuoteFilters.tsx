import { Search, Filter } from 'lucide-react';
import type { FilterState } from '../../App';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface QuoteFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export function QuoteFilters({ filters, setFilters }: QuoteFiltersProps) {
  const handleReset = () => {
    setFilters({
      vendorType: 'all',
      origin: '',
      destination: '',
      containerSize: '',
      minPrice: '',
      maxPrice: '',
      searchTerm: '',
    });
  };

  const hasActiveFilters = 
    filters.vendorType !== 'all' ||
    filters.origin ||
    filters.destination ||
    filters.containerSize ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.searchTerm;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Filter className="w-4 h-4" />
          <span>篩選條件</span>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            清除篩選
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="搜尋廠商名稱、航線、備註..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Vendor Type */}
        <div>
          <select
            value={filters.vendorType}
            onChange={(e) => setFilters({ ...filters, vendorType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">全部類型</option>
            <option value="shipping">海運</option>
            <option value="trucking">拖車</option>
            <option value="customs">報關</option>
          </select>
        </div>

        {/* Container Size */}
        <div>
          <select
            value={filters.containerSize}
            onChange={(e) => setFilters({ ...filters, containerSize: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">櫃型 (全部)</option>
            <option value="20GP">20GP</option>
            <option value="40GP">40GP</option>
            <option value="40HQ">40HQ</option>
            <option value="45HQ">45HQ</option>
          </select>
        </div>

        {/* Origin */}
        <div>
          <Input
            value={filters.origin}
            onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
            placeholder="起運港"
          />
        </div>

        {/* Destination */}
        <div>
          <Input
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            placeholder="目的港"
          />
        </div>

        {/* Min Price */}
        <div>
          <Input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            placeholder="最低價格"
          />
        </div>

        {/* Max Price */}
        <div>
          <Input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            placeholder="最高價格"
          />
        </div>
      </div>
    </div>
  );
}
