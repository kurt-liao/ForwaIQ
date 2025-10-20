import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import type { Quote } from '../../App';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { setupFormValidation } from '../../utils/validation/formValidation';
import type { CustomField } from '../../pages/CustomFieldsPage';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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

export function AddQuoteDialog({ open, onOpenChange, editingQuote, onSubmit }: AddQuoteDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorType: 'shipping' as 'shipping' | 'trucking' | 'customs',
    price: 0,
    currency: 'USD',
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

  const [customCarriers, setCustomCarriers] = useState<string[]>([]);
  const [showCustomCarrier, setShowCustomCarrier] = useState(false);
  const [newCarrier, setNewCarrier] = useState('');

  const [customPorts, setCustomPorts] = useState<string[]>([]);
  const [showCustomOrigin, setShowCustomOrigin] = useState(false);
  const [showCustomDestination, setShowCustomDestination] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [activeOptionalFields, setActiveOptionalFields] = useState<Set<string>>(new Set());

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

  // Load custom fields when vendor type changes
  useEffect(() => {
    if (open) {
      loadCustomFields(formData.vendorType);
    }
  }, [formData.vendorType, open]);

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

  useEffect(() => {
    if (editingQuote) {
      setFormData({
        vendorName: editingQuote.vendorName,
        vendorType: editingQuote.vendorType,
        price: editingQuote.price,
        currency: editingQuote.currency,
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
    } else {
      resetForm();
    }
  }, [editingQuote, open]);

  const resetForm = () => {
    setFormData({
      vendorName: '',
      vendorType: 'shipping',
      price: 0,
      currency: 'USD',
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
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
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.isRequired}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選擇{field.name}</option>
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
              <Input
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                required
                placeholder="例：長榮海運"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">廠商類型 *</label>
              <select
                value={formData.vendorType}
                onChange={(e) => setFormData({ ...formData, vendorType: e.target.value as any })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="shipping">海運</option>
                <option value="trucking">拖車</option>
                <option value="customs">報關</option>
              </select>
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">價格 *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                step="0.01"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">幣別 *</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="TWD">TWD</option>
                <option value="CNY">CNY</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">有效期限 *</label>
            <Input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              required
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          onClick={(e) => {
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
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">送達地點</label>
                  <Input
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                    placeholder="例：基隆港"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">車型</label>
                <Input
                  value={formData.truckType}
                  onChange={(e) => setFormData({ ...formData, truckType: e.target.value })}
                  placeholder="例：40ft"
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
                          onClick={(e) => {
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          onClick={(e) => {
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
