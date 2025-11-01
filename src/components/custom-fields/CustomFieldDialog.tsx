import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { CustomField } from '../../pages/CustomFieldsPage';
import { setupFormValidation } from '../../utils/validation/formValidation';

interface CustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingField?: CustomField | null;
  onSubmit: (fieldData: any) => void;
}

export function CustomFieldDialog({ open, onOpenChange, editingField, onSubmit }: CustomFieldDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    fieldType: 'text' as 'text' | 'number' | 'select' | 'date' | 'textarea',
    vendorType: 'shipping' as 'shipping' | 'trucking' | 'customs',
    isRequired: false,
    order: 1,
  });

  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (open && formRef.current) {
      setupFormValidation(formRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (editingField) {
      setFormData({
        name: editingField.name,
        fieldType: editingField.fieldType,
        vendorType: editingField.vendorType,
        isRequired: editingField.isRequired,
        order: editingField.order,
      });
      setOptions(editingField.options || []);
    } else {
      resetForm();
    }
  }, [editingField, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      fieldType: 'text',
      vendorType: 'shipping',
      isRequired: false,
      order: 1,
    });
    setOptions([]);
    setNewOption('');
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      options: formData.fieldType === 'select' ? options : undefined,
    };

    onSubmit(submitData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl text-gray-900">
              {editingField ? '編輯欄位' : '新增自定義欄位'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingField ? '修改欄位設定' : '為報價單新增自定義欄位'}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Field Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">欄位名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="例：靠泊碼頭、裝卸費用、特殊要求"
            />
            <p className="text-xs text-gray-500 mt-1">
              此名稱將顯示在報價單表單中
            </p>
          </div>

          {/* Vendor Type */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">適用廠商類型 *</label>
            <select
              value={formData.vendorType}
              onChange={(e) => setFormData({ ...formData, vendorType: e.target.value as any })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="shipping">海運</option>
              <option value="trucking">拖車</option>
              <option value="customs">報關</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              此欄位只會在對應類型的報價單中顯示
            </p>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">欄位類型 *</label>
            <select
              value={formData.fieldType}
              onChange={(e) => {
                setFormData({ ...formData, fieldType: e.target.value as any });
                if (e.target.value !== 'select') {
                  setOptions([]);
                }
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="text">文字輸入</option>
              <option value="number">數字輸入</option>
              <option value="select">下拉選單</option>
              <option value="date">日期選擇</option>
              <option value="textarea">多行文字</option>
            </select>
          </div>

          {/* Options for Select Type */}
          {formData.fieldType === 'select' && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm text-blue-900 mb-2">下拉選單選項</label>
                <p className="text-xs text-blue-700 mb-3">
                  請新增至少一個選項
                </p>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="輸入選項名稱"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新增
                  </Button>
                </div>

                {options.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-blue-700 mb-2">
                      已新增 {options.length} 個選項：
                    </div>
                    {options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded border border-blue-200"
                      >
                        <span className="text-sm text-gray-900">{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Is Required */}
          <div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-primary/20"
              />
              <label htmlFor="isRequired" className="text-sm text-gray-700">
                設為必填欄位
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-7">
              {formData.isRequired 
                ? '此欄位將自動顯示在報價表單中，必須填寫才能提交' 
                : '此欄位不會自動顯示，使用者可以透過「+ 添加欄位」按鈕選擇性地新增'}
            </p>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">顯示順序</label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              數字越小越靠前顯示（建議從 1 開始）
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-900">💡 提示</div>
            <p className="text-xs text-yellow-700 mt-1">
              自定義欄位會自動出現在對應類型的報價單表單中。您可以隨時編輯或刪除欄位，但已填寫的報價資料中的欄位值會保留。
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              {editingField ? '更新' : '新增'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
