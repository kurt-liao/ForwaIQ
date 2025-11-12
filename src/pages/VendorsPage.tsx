import { useState, useEffect } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import type { Vendor } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { VendorTable } from '../components/vendors/VendorTable';
import { VendorDialog } from '../components/vendors/VendorDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded`;

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'type' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/vendors`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVendors(data);
      console.log('載入供應商成功:', data.length);
    } catch (error) {
      console.error('載入供應商失敗:', error);
      toast.error('載入供應商失敗，請檢查網路連線');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.contacts?.some(c =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );

    const matchesType = filterType === 'all' || vendor.type === filterType;

    return matchesSearch && matchesType;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'name' | 'type' | 'rating') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddVendor = async (vendorData: any) => {
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
      setIsDialogOpen(false);
      setEditingVendor(null);
      toast.success('供應商新增成功！');
      console.log('新增供應商成功:', newVendor);
    } catch (error) {
      console.error('新增供應商失敗:', error);
      toast.error('新增供應商失敗，請稍後再試');
    }
  };

  const handleUpdateVendor = async (vendor: Vendor) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendor),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedVendor = await response.json();
      setVendors(vendors.map(v => v.id === vendor.id ? updatedVendor : v));
      setIsDialogOpen(false);
      setEditingVendor(null);
      toast.success('供應商更新成功！');
      console.log('更新供應商成功:', updatedVendor);
    } catch (error) {
      console.error('更新供應商失敗:', error);
      toast.error('更新供應商失敗，請稍後再試');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('確定要刪除此供應商嗎？此操作無法復原。')) return;

    try {
      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVendors(vendors.filter(v => v.id !== id));
      toast.success('供應商已刪除');
      console.log('刪除供應商成功:', id);
    } catch (error) {
      console.error('刪除供應商失敗:', error);
      toast.error('刪除供應商失敗，請稍後再試');
    }
  };

  const loadSampleVendors = async () => {
    const sampleVendors = [
      {
        name: '長榮海運',
        type: 'shipping',
        contacts: [
          {
            id: crypto.randomUUID(),
            name: '王經理',
            title: '業務經理',
            email: 'wang@evergreen.com',
            phone: '02-2505-7766',
            isPrimary: true,
          },
          {
            id: crypto.randomUUID(),
            name: '林小姐',
            title: '業務專員',
            email: 'lin@evergreen.com',
            phone: '02-2505-7767',
            isPrimary: false,
          },
        ],
        address: '台北市中山區',
        rating: 5,
        notes: '主要合作航線：台灣-中國-東南亞',
      },
      {
        name: '陽明海運',
        type: 'shipping',
        contacts: [
          {
            id: crypto.randomUUID(),
            name: '李小姐',
            title: '客戶經理',
            email: 'lee@yangming.com',
            phone: '02-2455-6688',
            isPrimary: true,
          },
        ],
        address: '基隆市',
        rating: 5,
        notes: '提供即時船期查詢服務',
      },
      {
        name: '台灣拖車',
        type: 'trucking',
        contacts: [
          {
            id: crypto.randomUUID(),
            name: '陳經理',
            title: '調度經理',
            email: 'chen@tw-truck.com',
            phone: '03-356-7788',
            isPrimary: true,
          },
          {
            id: crypto.randomUUID(),
            name: '張先生',
            title: '調度員',
            email: 'zhang@tw-truck.com',
            phone: '03-356-7789',
            isPrimary: false,
          },
        ],
        address: '桃園市',
        rating: 5,
        notes: '24小時服務，專業團隊',
      },
      {
        name: '佳鑫報關行',
        type: 'customs',
        contacts: [
          {
            id: crypto.randomUUID(),
            name: '黃小姐',
            title: '報關專員',
            email: 'huang@jiaxin.com',
            phone: '02-2720-1234',
            isPrimary: true,
          },
        ],
        address: '台北市信義區',
        rating: 5,
        notes: '專業簽審文件處理，快速通關',
      },
    ];

    try {
      // 批次新增到資料庫
      const promises = sampleVendors.map(vendor =>
        fetch(`${API_URL}/vendors`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vendor),
        })
      );

      const responses = await Promise.all(promises);
      const newVendors = await Promise.all(
        responses.map(res => res.json())
      );

      setVendors([...vendors, ...newVendors]);
      toast.success(`示範數據已加載！成功新增 ${newVendors.length} 個供應商`);
      console.log('載入範例供應商成功:', newVendors.length);
    } catch (error) {
      console.error('載入範例供應商失敗:', error);
      toast.error('載入範例數據失敗，請稍後再試');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-gray-900">供應商管理</h1>
                <p className="text-sm text-gray-500">管理合作廠商資訊與聯絡方式</p>
              </div>
            </div>
            <Button onClick={() => {
              setEditingVendor(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              新增供應商
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">總供應商數</div>
            <div className="text-2xl text-gray-900 mt-1">{vendors.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">海運公司</div>
            <div className="text-2xl text-gray-900 mt-1">
              {vendors.filter(v => v.type === 'shipping').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">拖車公司</div>
            <div className="text-2xl text-gray-900 mt-1">
              {vendors.filter(v => v.type === 'trucking').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">報關行</div>
            <div className="text-2xl text-gray-900 mt-1">
              {vendors.filter(v => v.type === 'customs').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋供應商名稱、聯絡人、Email..."
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部類型</option>
              <option value="shipping">海運</option>
              <option value="trucking">拖車</option>
              <option value="customs">報關</option>
            </select>
          </div>
        </div>

        {/* Vendors List */}
        {loading && (
          <div className="text-center py-12 text-gray-500">載入中...</div>
        )}

        {!loading && filteredVendors.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' ? '沒有符合條件的供應商' : '暫無供應商資料'}
            </p>
            {!searchTerm && filterType === 'all' && vendors.length === 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-400">點擊「新增供應商」開始建立廠商資料庫</p>
                <Button variant="outline" onClick={loadSampleVendors}>
                  載入範例供應商
                </Button>
              </div>
            )}
          </div>
        )}

        {!loading && sortedVendors.length > 0 && (
          <VendorTable
            vendors={sortedVendors}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={(vendor) => {
              setEditingVendor(vendor);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteVendor}
          />
        )}
      </main>

      <VendorDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingVendor(null);
          }
        }}
        editingVendor={editingVendor}
        onSubmit={editingVendor ? handleUpdateVendor : handleAddVendor}
      />
    </div>
  );
}
