import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import type { Quote, QuoteLineItem, FeeType } from '../../App'; // 導入 QuoteLineItem 和 FeeType
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { setupFormValidation } from '../../utils/validation/formValidation';
import type { CustomField } from '../../pages/CustomFieldsPage';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { calculateTotalTWD, convertFromTWD, getCurrencySymbol } from '../../utils/currency';

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuote?: Quote | null;
  onSubmit: (quote: any) => void;
}

// 常見船公司列表
const COMMON_CARRIERS = [
  'EVERGREEN (長榮)',
  'YANG MING (陽明)',
  'WAN HAI (萬海)',
  'COSCO (中遠)',
  'OOCL (東方海外)',
  'CMA CGM',
  'MSC (地中海)',
  'MAERSK (馬士基)',
  'HAPAG-LLOYD',
  'ONE (海洋網聯)',
  'HMM (現代商船)',
  'PIL (太平船務)',
  'ZIM',
  'APL',
  'KMTC',
];

// 常見港口列表
const COMMON_PORTS = {
  taiwan: [
    '基隆港 (Keelung)',
    '台北港 (Taipei)',
    '台中港 (Taichung)',
    '高雄港 (Kaohsiung)',
  ],
  china: [
    '上海港 (Shanghai)',
    '寧波港 (Ningbo)',
    '深圳港 (Shenzhen)',
    '廣州港 (Guangzhou)',
    '青島港 (Qingdao)',
    '天津港 (Tianjin)',
    '廈門港 (Xiamen)',
    '大連港 (Dalian)',
  ],
  asia: [
    '香港 (Hong Kong)',
    '新加坡 (Singapore)',
    '東京港 (Tokyo)',
    '橫濱港 (Yokohama)',
    '釜山港 (Busan)',
    '曼谷港 (Bangkok)',
    '胡志明港 (Ho Chi Minh)',
    '馬尼拉港 (Manila)',
  ],
  others: [
    '洛杉磯港 (Los Angeles)',
    '長灘港 (Long Beach)',
    '紐約港 (New York)',
    '鹿特丹港 (Rotterdam)',
    '漢堡港 (Hamburg)',
    '杜拜港 (Dubai)',
  ],
};

const ALL_PORTS = [
  ...COMMON_PORTS.taiwan,
  ...COMMON_PORTS.china,
  ...COMMON_PORTS.asia,
  ...COMMON_PORTS.others,
];

// 將英文 vendorType 轉換為中文 category
const getCategoryFromVendorType = (vendorType: string): string => {
  switch (vendorType) {
    case 'shipping': return '海運';
    case 'trucking': return '拖車';
    case 'customs': return '報關';
    default: return vendorType;
  }
};

export function AddQuoteDialog({ open, onOpenChange, editingQuote, onSubmit }: AddQuoteDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorName: '',
    vendorType: 'shipping' as 'shipping' | 'trucking' | 'customs',
    // price: 0, // 移除
    // currency: 'USD', // 移除
    validUntil: '',
    origin: '',
    destination: '',
    carrier: '',
    transitTime: '',
    containerSize: '',
    pickupLocation: '',
    deliveryLocation: '',
    truckType: '',
    customsType: '',
    productCategory: '',
    notes: '',
  });

  // 新增 lineItems 狀態
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { cost: 0, currency: 'USD', descriptionLegacy: '' } // 預設一個空項目
  ]);

  const [customCarriers, setCustomCarriers] = useState<string[]>([]);
  const [showCustomCarrier, setShowCustomCarrier] = useState(false);
  const [newCarrier, setNewCarrier] = useState('');

  const [customPorts, setCustomPorts] = useState<string[]>([]);
  const [showCustomOrigin, setShowCustomOrigin] = useState(false);
  const [showCustomDestination, setShowCustomDestination] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  // Vendor selection state
  const [vendors, setVendors] = useState<any[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [activeOptionalFields, setActiveOptionalFields] = useState<Set<string>>(new Set());

  // Fee types state
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [showAddFeeType, setShowAddFeeType] = useState(false);
  const [newFeeTypeName, setNewFeeTypeName] = useState('');

  // Setup form validation
  useEffect(() => {
    if (open && formRef.current) {
      setupFormValidation(formRef.current);
    }
  }, [open]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close all dropdown menus
      document.querySelectorAll('.custom-field-dropdown').forEach(menu => {
        const button = menu.previousElementSibling;
        if (button && !button.contains(target) && !menu.contains(target)) {
          menu.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  // Load custom fields and vendors when vendor type changes or when editing
  useEffect(() => {
    if (open && formData.vendorType) {
      loadCustomFields(formData.vendorType);
      loadVendors(formData.vendorType);
    }
  }, [formData.vendorType, open]);

  // Load fee types when dialog opens
  useEffect(() => {
    if (open) {
      loadFeeTypes();
    }
  }, [open]);

  // When vendor type changes, clear invalid fee types from line items
  useEffect(() => {
    if (feeTypes.length > 0) {
      setLineItems(prevItems =>
        prevItems.map(item => {
          if (item.feeTypeId) {
            const feeTypeId = item.feeTypeId; // Extract to avoid TypeScript issues
            const feeType = feeTypes.find(ft => ft.feeTypeId === feeTypeId);
            if (!feeType || feeType.category !== getCategoryFromVendorType(formData.vendorType)) {
              // Clear invalid fee type
              return { ...item, feeTypeId: undefined, descriptionLegacy: '' };
            }
          }
          return item;
        })
      );
    }
  }, [formData.vendorType, feeTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCustomFields = async (vendorType: 'shipping' | 'trucking' | 'customs') => {
    try {
      console.log(`載入自定義欄位 - 廠商類型: ${vendorType}`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields/vendor/${vendorType}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const fields = await response.json();
        console.log(`成功載入 ${fields.length} 個自定義欄位:`, fields);
        setCustomFields(fields);
      } else {
        console.error('載入自定義欄位失敗:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('載入自定義欄位時發生錯誤:', error);
    }
  };

  const loadFeeTypes = async () => {
    try {
      console.log('載入費用類型');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/fee-types`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const types = await response.json();
        console.log(`成功載入 ${types.length} 個費用類型:`, types);
        console.log('費用類型詳細資訊:', types.map((t: any) => ({ feeTypeId: t.feeTypeId, name: t.name, category: t.category })));
        setFeeTypes(types);
      } else {
        console.error('載入費用類型失敗:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('載入費用類型時發生錯誤:', error);
    }
  };

  const addNewFeeType = async (name: string, lineItemIndex: number) => {
    try {
      const feeTypeData = {
        name: name.trim(),
        category: getCategoryFromVendorType(formData.vendorType),
      };

      console.log('新增費用類型:', feeTypeData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/fee-types`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feeTypeData),
        }
      );

      if (response.ok) {
        const newFeeType = await response.json();
        console.log('成功新增費用類型:', newFeeType);

        // 更新費用類型列表
        setFeeTypes([...feeTypes, newFeeType]);

        // 將新費用項目設置為當前項目
        setLineItems(prevItems =>
          prevItems.map((item, i) => {
            if (i === lineItemIndex) {
              return { ...item, feeTypeId: newFeeType.feeTypeId, descriptionLegacy: newFeeType.name };
            }
            return item;
          })
        );

        // 隱藏輸入框並清空輸入
        setShowAddFeeType(false);
        setNewFeeTypeName('');

        toast.success('費用項目新增成功');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('新增費用項目失敗:', error);
      toast.error('新增費用項目失敗，請稍後再試');
    }
  };

  const loadVendors = async (vendorType: string) => {
    try {
      console.log('載入供應商列表', vendorType);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/vendors`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const vendorsData = await response.json();
        console.log('API 返回的廠商數據:', vendorsData);
        console.log('過濾類型:', vendorType);

        // 只載入當前類型的供應商，並確保資料完整性
        const filteredVendors = vendorsData
          .filter((v: any) => {
            const matches = v && v.type === vendorType && v.vendorId && v.name;
            if (!matches) {
              console.log('廠商被過濾掉:', v, '原因:', {
                hasV: !!v,
                typeMatch: v?.type === vendorType,
                hasVendorId: !!v?.vendorId,
                hasName: !!v?.name
              });
            }
            return matches;
          })
          .map((v: any) => ({
            id: v.vendorId,
            name: v.name,
            type: v.type,
            contacts: v.contacts || []
          }));

        console.log(`成功載入 ${filteredVendors.length} 個${vendorType}供應商:`, filteredVendors);

        // 如果過濾後沒有廠商，作為後備載入所有廠商
        if (filteredVendors.length === 0) {
          console.warn(`沒有找到 ${vendorType} 類型的廠商，載入所有廠商作為後備`);
          const allVendors = vendorsData
            .filter((v: any) => v && v.vendorId && v.name)
            .map((v: any) => ({
              id: v.vendorId,
              name: v.name,
              type: v.type,
              contacts: v.contacts || []
            }));
          setVendors(allVendors);
        } else {
          setVendors(filteredVendors);
        }
      } else {
        console.error('載入供應商失敗:', response.status, response.statusText);
        setVendors([]); // 確保不會有 undefined 資料
      }
    } catch (error) {
      console.error('載入供應商時發生錯誤:', error);
      setVendors([]); // 確保不會有 undefined 資料
    }
  };

  // Set form data when editing quote changes
  useEffect(() => {
    if (editingQuote) {
      setFormData({
        vendorId: editingQuote.vendorId ? editingQuote.vendorId.toString() : '',
        vendorName: editingQuote.vendorName,
        vendorType: editingQuote.vendorType,
        // price: editingQuote.price, // 移除
        // currency: editingQuote.currency, // 移除
        validUntil: editingQuote.validUntil.split('T')[0],
        origin: editingQuote.origin || '',
        destination: editingQuote.destination || '',
        carrier: editingQuote.carrier || '',
        transitTime: editingQuote.transitTime || '',
        containerSize: editingQuote.containerSize || '',
        pickupLocation: editingQuote.pickupLocation || '',
        deliveryLocation: editingQuote.deliveryLocation || '',
        truckType: editingQuote.truckType || '',
        customsType: editingQuote.customsType || '',
        productCategory: editingQuote.productCategory || '',
        notes: editingQuote.notes || '',
      });
      // 載入 lineItems
      setLineItems(editingQuote.lineItems && editingQuote.lineItems.length > 0
        ? editingQuote.lineItems
        : [{ cost: 0, currency: 'USD', descriptionLegacy: '' }]);
      // Load custom field values from editing quote
      const existingCustomFields = (editingQuote as any).customFields || {};
      setCustomFieldValues(existingCustomFields);
      // 編輯時，顯示所有已填寫的非必填欄位
      const activeFields = new Set<string>();
      Object.keys(existingCustomFields).forEach(fieldId => {
        if (existingCustomFields[fieldId]) {
          activeFields.add(fieldId);
        }
      });
      setActiveOptionalFields(activeFields);

      // 載入廠商列表和自定義字段
      if (editingQuote.vendorType && typeof editingQuote.vendorType === 'string') {
        loadVendors(editingQuote.vendorType);
        loadCustomFields(editingQuote.vendorType);
      } else {
        console.warn('編輯報價時 vendorType 無效:', editingQuote.vendorType);
        // 如果沒有 vendorType，載入所有廠商作為後備
        loadVendors('shipping'); // 預設載入海運廠商
        loadCustomFields('shipping');
      }
    } else {
      resetForm();
    }
  }, [editingQuote]);

  // Ensure vendor selection is correct when vendors list loads and we're editing
  useEffect(() => {
    if (editingQuote && vendors.length > 0) {
      // 如果有 vendorId，根據 ID 找到廠商
      if (formData.vendorId) {
        const vendor = vendors.find(v => v.id && v.id.toString() === formData.vendorId);
        if (vendor && vendor.name && formData.vendorName !== vendor.name) {
          setFormData(prev => ({
            ...prev,
            vendorName: vendor.name
          }));
        }
      }
      // 如果沒有 vendorId 但有 vendorName，根據名稱找到廠商
      else if (formData.vendorName) {
        const vendor = vendors.find(v => v.name === formData.vendorName && v.type === editingQuote.vendorType);
        if (vendor) {
          setFormData(prev => ({
            ...prev,
            vendorId: vendor.id.toString(),
            vendorName: vendor.name
          }));
        }
      }
    }
  }, [vendors, editingQuote]);

  const resetForm = () => {
    setFormData({
      vendorId: '',
      vendorName: '',
      vendorType: 'shipping',
      // price: 0, // 移除
      // currency: 'USD', // 移除
      validUntil: '',
      origin: '',
      destination: '',
      carrier: '',
      transitTime: '',
      containerSize: '',
      pickupLocation: '',
      deliveryLocation: '',
      truckType: '',
      customsType: '',
      productCategory: '',
      notes: '',
    });
    setCustomFieldValues({});
    setActiveOptionalFields(new Set());
    setLineItems([{ cost: 0, currency: 'USD', descriptionLegacy: '' }]); // 重置 lineItems
  };

  // 新增報價明細項目
  const addLineItem = () => {
    setLineItems([...lineItems, { cost: 0, currency: 'USD', descriptionLegacy: '' }]);
  };

  // 刪除報價明細項目
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // 更新報價明細項目
  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: any) => {
    const updatedItems = lineItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setLineItems(updatedItems);
  };

  // 當選擇費用類型時，自動填入 feeTypeId 和 descriptionLegacy
  const handleFeeTypeChange = (index: number, feeTypeId: string) => {
    const selectedFeeType = feeTypes.find(type => type.feeTypeId.toString() === feeTypeId);

    setLineItems(prevItems =>
      prevItems.map((item, i) => {
        if (i === index) {
          if (selectedFeeType) {
            const feeTypeIdNumber = parseInt(feeTypeId, 10);
            return { ...item, feeTypeId: feeTypeIdNumber, descriptionLegacy: selectedFeeType.name };
          } else {
            return { ...item, feeTypeId: undefined, descriptionLegacy: '' };
          }
        }
        return item;
      })
    );
  };

  // 計算總價（轉換為 TWD 後相加）
  const calculateTotalAndCurrency = () => {
    if (lineItems.length === 0) return { total: 0, currency: 'TWD' };

    const totalTWD = calculateTotalTWD(lineItems);
    const currencies = [...new Set(lineItems.map(item => item.currency))];

    // 如果只有一種貨幣，使用該貨幣顯示總價
    if (currencies.length === 1) {
      const currency = currencies[0];
      const total = convertFromTWD(totalTWD, currency);
      return { total, currency };
    }

    // 如果有多種貨幣，顯示 TWD 總價
    return { total: totalTWD, currency: 'TWD' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { total, currency } = calculateTotalAndCurrency();

    // 將前端的 camelCase 字段轉換為後端的 snake_case
    const processedLineItems = lineItems.map(item => ({
      ...item,
      fee_type_id: item.feeTypeId, // 轉換為 snake_case 用於後端
      description_legacy: item.descriptionLegacy, // 轉換為 snake_case 用於後端
      display_order: item.order, // 轉換為 snake_case 用於後端
      // 移除前端使用的 camelCase 版本
      feeTypeId: undefined,
      descriptionLegacy: undefined,
      order: undefined,
    }));

    const submitData = {
      ...formData,
      total_cost_display: total,
      base_currency: currency,
      lineItems: processedLineItems,
      customFields: customFieldValues,
    };

    if (editingQuote) {
      onSubmit({ ...editingQuote, ...submitData });
    } else {
      onSubmit(submitData);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id] || '';

    switch (field.fieldType) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            placeholder={`輸入${field.name}`}
            className="bg-white"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            placeholder={`輸入${field.name}`}
            className="bg-white"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option key={`select-${field.name}`} value="">選擇{field.name}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            className="bg-white"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            placeholder={`輸入${field.name}`}
            rows={3}
            className="bg-white"
          />
        );
      
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl text-gray-900">{editingQuote ? '編輯報價' : '新增報價'}</h2>
            <p className="text-sm text-gray-500 mt-1">填寫報價相關資訊</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vendor Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">廠商名稱 *</label>
              <div className="relative">
                <select
                  value={formData.vendorId}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (selectedValue === '__add_new__') {
                      setShowAddVendor(true);
                      setNewVendorName('');
                    } else {
                      const selectedVendor = vendors.find(v => v.id && v.id.toString() === selectedValue);
                      if (selectedVendor) {
                        setFormData({
                          ...formData,
                          vendorId: selectedValue,
                          vendorName: selectedVendor.name
                        });
                      } else {
                        // 如果找不到供應商，可能是資料同步問題，只設置 vendorId
                        setFormData({
                          ...formData,
                          vendorId: selectedValue,
                          vendorName: '' // 或者保持原有的名稱
                        });
                      }
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option key="select-vendor" value="">選擇廠商</option>
                  {vendors.filter(vendor => vendor.id).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                  <option key="__add_new__" value="__add_new__" className="text-blue-600 font-medium">
                    + 新增廠商
                  </option>
                </select>
              </div>

              {/* 新增廠商輸入框 */}
              {showAddVendor && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2">
                    <Input
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      placeholder="輸入新廠商名稱"
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (newVendorName.trim()) {
                          try {
                            const vendorData = {
                              name: newVendorName.trim(),
                              type: formData.vendorType,
                              contacts: [],
                              rating: 5,
                              notes: '通過報價系統新增',
                            };

                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/vendors`,
                              {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${publicAnonKey}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(vendorData),
                              }
                            );

                            if (response.ok) {
                              const newVendor = await response.json();
                              setVendors([...vendors, newVendor]);
                              setFormData({
                                ...formData,
                                vendorId: newVendor.id,
                                vendorName: newVendor.name
                              });
                              setShowAddVendor(false);
                              setNewVendorName('');
                              toast.success('廠商新增成功');
                            } else {
                              throw new Error(`HTTP ${response.status}`);
                            }
                          } catch (error) {
                            console.error('新增廠商失敗:', error);
                            toast.error('新增廠商失敗，請稍後再試');
                          }
                        }
                      }}
                    >
                      新增
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddVendor(false);
                        setNewVendorName('');
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">廠商類型 *</label>
              <select
                value={formData.vendorType}
                onChange={(e) => setFormData({ ...formData, vendorType: e.target.value as any })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option key="vendor-type-shipping" value="shipping">海運</option>
                <option key="vendor-type-trucking" value="trucking">拖車</option>
                <option key="vendor-type-customs" value="customs">報關</option>
              </select>
            </div>
          </div>

          {/* Quote Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">報價明細</h3>
              <Button
                type="button"
                onClick={addLineItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增項目
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">項目 {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">費用項目 *</label>
                      {!showAddFeeType ? (
                        <select
                          value={item.feeTypeId?.toString() || ''}
                          onChange={(e) => {
                            if (e.target.value === '__add_new__') {
                              setShowAddFeeType(true);
                              setNewFeeTypeName('');
                            } else {
                              handleFeeTypeChange(index, e.target.value);
                            }
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option key="select-fee-type" value="">選擇費用項目</option>
                          {feeTypes
                            .filter((feeType) => feeType.category === getCategoryFromVendorType(formData.vendorType))
                            .map((feeType) => (
                              <option key={feeType.feeTypeId} value={feeType.feeTypeId}>
                                {feeType.name}
                              </option>
                            ))}
                          <option key="__add_new__" value="__add_new__" className="text-blue-600 font-medium">
                            + 新增費用項目
                          </option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={newFeeTypeName}
                            onChange={(e) => setNewFeeTypeName(e.target.value)}
                            placeholder="輸入費用項目名稱"
                            autoFocus
                            className="flex-1 bg-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              if (newFeeTypeName.trim()) {
                                await addNewFeeType(newFeeTypeName.trim(), index);
                              }
                            }}
                          >
                            新增
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddFeeType(false);
                              setNewFeeTypeName('');
                            }}
                          >
                            取消
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">費用 *</label>
                      <Input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateLineItem(index, 'cost', parseFloat(e.target.value) || 0)}
                        required
                        step="0.01"
                        placeholder="0"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">幣別 *</label>
                      <select
                        value={item.currency}
                        onChange={(e) => updateLineItem(index, 'currency', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                      >
                        <option key="currency-usd" value="USD">USD</option>
                        <option key="currency-twd" value="TWD">TWD</option>
                        <option key="currency-cny" value="CNY">CNY</option>
                        <option key="currency-eur" value="EUR">EUR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">備註</label>
                      <Input
                        value={item.remarks || ''}
                        onChange={(e) => updateLineItem(index, 'remarks', e.target.value)}
                        placeholder="選填"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 總價顯示 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">總計：</span>
                <span className="text-lg font-bold text-blue-900">
                  {getCurrencySymbol(calculateTotalAndCurrency().currency)} {calculateTotalAndCurrency().total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">有效期限 *</label>
            <Input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              required
              className="bg-white"
            />
          </div>

          {/* Shipping Fields */}
          {formData.vendorType === 'shipping' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-900 font-medium">海運資訊</div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Origin Port */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">起運港</label>
                  {!showCustomOrigin ? (
                    <select
                      value={formData.origin}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setShowCustomOrigin(true);
                          setFormData({ ...formData, origin: '' });
                        } else {
                          setFormData({ ...formData, origin: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    >
                      <option value="">選擇起運港</option>
                      <optgroup label="台灣">
                        {COMMON_PORTS.taiwan.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="中國">
                        {COMMON_PORTS.china.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="亞洲">
                        {COMMON_PORTS.asia.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="其他">
                        {COMMON_PORTS.others.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      {customPorts.length > 0 && (
                        <optgroup label="自訂港口">
                          {customPorts.map((port) => (
                            <option key={port} value={port}>{port} ⭐</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__custom__">+ 新增其他港口</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newOrigin}
                        onChange={(e) => setNewOrigin(e.target.value)}
                        placeholder="輸入港口名稱"
                        autoFocus
                        className="bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newOrigin.trim()) {
                            setCustomPorts([...customPorts, newOrigin.trim()]);
                            setFormData({ ...formData, origin: newOrigin.trim() });
                            setNewOrigin('');
                            setShowCustomOrigin(false);
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomOrigin(false);
                          setNewOrigin('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Destination Port */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">目的港</label>
                  {!showCustomDestination ? (
                    <select
                      value={formData.destination}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setShowCustomDestination(true);
                          setFormData({ ...formData, destination: '' });
                        } else {
                          setFormData({ ...formData, destination: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    >
                      <option value="">選擇目的港</option>
                      <optgroup label="台灣">
                        {COMMON_PORTS.taiwan.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="中國">
                        {COMMON_PORTS.china.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="亞洲">
                        {COMMON_PORTS.asia.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      <optgroup label="其他">
                        {COMMON_PORTS.others.map((port) => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </optgroup>
                      {customPorts.length > 0 && (
                        <optgroup label="自訂港口">
                          {customPorts.map((port) => (
                            <option key={port} value={port}>{port} ⭐</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__custom__">+ 新增其他港口</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        placeholder="輸入港口名稱"
                        autoFocus
                        className="bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newDestination.trim()) {
                            setCustomPorts([...customPorts, newDestination.trim()]);
                            setFormData({ ...formData, destination: newDestination.trim() });
                            setNewDestination('');
                            setShowCustomDestination(false);
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomDestination(false);
                          setNewDestination('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">船公司</label>
                  {!showCustomCarrier ? (
                    <div className="space-y-2">
                      <select
                        value={formData.carrier}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomCarrier(true);
                            setFormData({ ...formData, carrier: '' });
                          } else {
                            setFormData({ ...formData, carrier: e.target.value });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                      >
                        <option value="">選擇船公司</option>
                        {COMMON_CARRIERS.map((carrier) => (
                          <option key={carrier} value={carrier}>
                            {carrier}
                          </option>
                        ))}
                        {customCarriers.map((carrier) => (
                          <option key={carrier} value={carrier}>
                            {carrier} ⭐
                          </option>
                        ))}
                        <option value="__custom__">+ 新增其他船公司</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newCarrier}
                        onChange={(e) => setNewCarrier(e.target.value)}
                        placeholder="輸入船公司名稱"
                        autoFocus
                        className="bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newCarrier.trim()) {
                            setCustomCarriers([...customCarriers, newCarrier.trim()]);
                            setFormData({ ...formData, carrier: newCarrier.trim() });
                            setNewCarrier('');
                            setShowCustomCarrier(false);
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomCarrier(false);
                          setNewCarrier('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">櫃型</label>
                  <select
                    value={formData.containerSize}
                    onChange={(e) => setFormData({ ...formData, containerSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option value="">選擇櫃型</option>
                    <option value="20GP">20GP</option>
                    <option value="40GP">40GP</option>
                    <option value="40HQ">40HQ</option>
                    <option value="45HQ">45HQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">航程時間</label>
                  <Input
                    value={formData.transitTime}
                    onChange={(e) => setFormData({ ...formData, transitTime: e.target.value })}
                    placeholder="例：3-5天"
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Custom Fields for Shipping */}
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-blue-900 font-medium">自定義欄位</div>
                    {customFields.filter(f => !f.isRequired && !activeOptionalFields.has(f.id)).length > 0 && (
                      <div className="relative group">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const btn = e.currentTarget;
                            const menu = btn.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加欄位
                        </Button>
                        <div className="custom-field-dropdown hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                          {customFields
                            .filter(f => !f.isRequired && !activeOptionalFields.has(f.id))
                            .map((field) => (
                              <button
                                key={field.id}
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg"
                                onClick={(e) => {
                                  const menu = e.currentTarget.parentElement as HTMLElement;
                                  menu.classList.add('hidden');
                                  setActiveOptionalFields(prev => new Set([...prev, field.id]));
                                }}
                              >
                                {field.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Required fields */}
                    {customFields
                      .filter(f => f.isRequired)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm text-gray-700 mb-2">
                            {field.name}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                    
                    {/* Optional fields that have been activated */}
                    {customFields
                      .filter(f => !f.isRequired && activeOptionalFields.has(f.id))
                      .map((field) => (
                        <div key={field.id}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm text-gray-700">
                              {field.name}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOptionalFields(prev => {
                                  const next = new Set(prev);
                                  next.delete(field.id);
                                  return next;
                                });
                                setCustomFieldValues(prev => {
                                  const next = { ...prev };
                                  delete next[field.id];
                                  return next;
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {renderCustomField(field)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trucking Fields */}
          {formData.vendorType === 'trucking' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-900 font-medium">拖車資訊</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">取貨地點</label>
                  <Input
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    placeholder="例：桃園龜山"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">送達地點</label>
                  <Input
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                    placeholder="例：基隆港"
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">車型</label>
                <Input
                  value={formData.truckType}
                  onChange={(e) => setFormData({ ...formData, truckType: e.target.value })}
                  placeholder="例：40ft"
                  className="bg-white"
                />
              </div>

              {/* Custom Fields for Trucking */}
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-green-900 font-medium">自定義欄位</div>
                    {customFields.filter(f => !f.isRequired && !activeOptionalFields.has(f.id)).length > 0 && (
                      <div className="relative group">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const btn = e.currentTarget;
                            const menu = btn.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加欄位
                        </Button>
                        <div className="custom-field-dropdown hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                          {customFields
                            .filter(f => !f.isRequired && !activeOptionalFields.has(f.id))
                            .map((field) => (
                              <button
                                key={field.id}
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 first:rounded-t-lg last:rounded-b-lg"
                                onClick={(e) => {
                                  const menu = e.currentTarget.parentElement as HTMLElement;
                                  menu.classList.add('hidden');
                                  setActiveOptionalFields(prev => new Set([...prev, field.id]));
                                }}
                              >
                                {field.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Required fields */}
                    {customFields
                      .filter(f => f.isRequired)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm text-gray-700 mb-2">
                            {field.name}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                    
                    {/* Optional fields that have been activated */}
                    {customFields
                      .filter(f => !f.isRequired && activeOptionalFields.has(f.id))
                      .map((field) => (
                        <div key={field.id}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm text-gray-700">
                              {field.name}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOptionalFields(prev => {
                                  const next = new Set(prev);
                                  next.delete(field.id);
                                  return next;
                                });
                                setCustomFieldValues(prev => {
                                  const next = { ...prev };
                                  delete next[field.id];
                                  return next;
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {renderCustomField(field)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customs Fields */}
          {formData.vendorType === 'customs' && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-900 font-medium">報關資訊</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">報關類型</label>
                  <select
                    value={formData.customsType}
                    onChange={(e) => setFormData({ ...formData, customsType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  >
                    <option value="">選擇類型</option>
                    <option value="出口報關">出口報關</option>
                    <option value="進口報關">進口報關</option>
                    <option value="轉口報關">轉口報關</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">產品類別</label>
                  <Input
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    placeholder="例：電子產品"
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Custom Fields for Customs */}
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-orange-900 font-medium">自定義欄位</div>
                    {customFields.filter(f => !f.isRequired && !activeOptionalFields.has(f.id)).length > 0 && (
                      <div className="relative group">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const btn = e.currentTarget;
                            const menu = btn.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加欄位
                        </Button>
                        <div className="custom-field-dropdown hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                          {customFields
                            .filter(f => !f.isRequired && !activeOptionalFields.has(f.id))
                            .map((field) => (
                              <button
                                key={field.id}
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 first:rounded-t-lg last:rounded-b-lg"
                                onClick={(e) => {
                                  const menu = e.currentTarget.parentElement as HTMLElement;
                                  menu.classList.add('hidden');
                                  setActiveOptionalFields(prev => new Set([...prev, field.id]));
                                }}
                              >
                                {field.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Required fields */}
                    {customFields
                      .filter(f => f.isRequired)
                      .map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm text-gray-700 mb-2">
                            {field.name}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          {renderCustomField(field)}
                        </div>
                      ))}
                    
                    {/* Optional fields that have been activated */}
                    {customFields
                      .filter(f => !f.isRequired && activeOptionalFields.has(f.id))
                      .map((field) => (
                        <div key={field.id}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm text-gray-700">
                              {field.name}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOptionalFields(prev => {
                                  const next = new Set(prev);
                                  next.delete(field.id);
                                  return next;
                                });
                                setCustomFieldValues(prev => {
                                  const next = { ...prev };
                                  delete next[field.id];
                                  return next;
                                });
                              }}
                              className="text-xs text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {renderCustomField(field)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">備註</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="其他需要記錄的資訊..."
              className="bg-white"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              {editingQuote ? '更新' : '新增'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
