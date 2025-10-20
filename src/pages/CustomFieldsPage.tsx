import { useState, useEffect } from 'react';
import { Plus, Settings2, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { CustomFieldDialog } from '../components/custom-fields/CustomFieldDialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export interface CustomField {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'textarea';
  vendorType: 'shipping' | 'trucking' | 'customs';
  options?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const VENDOR_TYPE_LABELS = {
  shipping: '海運',
  trucking: '拖車',
  customs: '報關'
};

const FIELD_TYPE_LABELS = {
  text: '文字',
  number: '數字',
  select: '下拉選單',
  date: '日期',
  textarea: '多行文字'
};

export function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedVendorType, setSelectedVendorType] = useState<'all' | 'shipping' | 'trucking' | 'customs'>('all');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }

      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast.error('載入自定義欄位失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async (fieldData: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fieldData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create custom field');
      }

      const newField = await response.json();
      setFields([...fields, newField]);
      setDialogOpen(false);
      toast.success('欄位新增成功');
    } catch (error) {
      console.error('Error creating custom field:', error);
      toast.error('新增欄位失敗');
    }
  };

  const handleUpdateField = async (fieldData: any) => {
    if (!editingField) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields/${editingField.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fieldData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update custom field');
      }

      const updatedField = await response.json();
      setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
      setDialogOpen(false);
      setEditingField(null);
      toast.success('欄位更新成功');
    } catch (error) {
      console.error('Error updating custom field:', error);
      toast.error('更新欄位失敗');
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('確定要刪除此欄位嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete custom field');
      }

      setFields(fields.filter(f => f.id !== id));
      toast.success('欄位已刪除');
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast.error('刪除欄位失敗');
    }
  };

  const filteredFields = selectedVendorType === 'all' 
    ? fields 
    : fields.filter(f => f.vendorType === selectedVendorType);

  const groupedFields = {
    shipping: filteredFields.filter(f => f.vendorType === 'shipping').sort((a, b) => a.order - b.order),
    trucking: filteredFields.filter(f => f.vendorType === 'trucking').sort((a, b) => a.order - b.order),
    customs: filteredFields.filter(f => f.vendorType === 'customs').sort((a, b) => a.order - b.order),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 flex items-center gap-2">
              <Settings2 className="w-8 h-8" />
              自定義欄位管理
            </h1>
            <p className="text-gray-600 mt-1">
              為不同類型的廠商設定專屬的報價欄位
            </p>
          </div>
          <Button onClick={() => {
            setEditingField(null);
            setDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            新增欄位
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setSelectedVendorType('all')}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              selectedVendorType === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            全部 ({fields.length})
          </button>
          <button
            onClick={() => setSelectedVendorType('shipping')}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              selectedVendorType === 'shipping'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            海運 ({groupedFields.shipping.length})
          </button>
          <button
            onClick={() => setSelectedVendorType('trucking')}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              selectedVendorType === 'trucking'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            拖車 ({groupedFields.trucking.length})
          </button>
          <button
            onClick={() => setSelectedVendorType('customs')}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              selectedVendorType === 'customs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            報關 ({groupedFields.customs.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">載入中...</div>
          </div>
        ) : selectedVendorType === 'all' ? (
          <div className="space-y-8">
            {/* Shipping Fields */}
            {groupedFields.shipping.length > 0 && (
              <div>
                <h2 className="text-gray-900 mb-4">海運欄位</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedFields.shipping.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      onEdit={() => {
                        setEditingField(field);
                        setDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteField(field.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trucking Fields */}
            {groupedFields.trucking.length > 0 && (
              <div>
                <h2 className="text-gray-900 mb-4">拖車欄位</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedFields.trucking.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      onEdit={() => {
                        setEditingField(field);
                        setDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteField(field.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Customs Fields */}
            {groupedFields.customs.length > 0 && (
              <div>
                <h2 className="text-gray-900 mb-4">報關欄位</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedFields.customs.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      onEdit={() => {
                        setEditingField(field);
                        setDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteField(field.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {fields.length === 0 && (
              <Card className="p-12 text-center">
                <Settings2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">尚未設定自定義欄位</h3>
                <p className="text-gray-600 mb-4">
                  開始新增自定義欄位，讓報價單更符合您的業務需求
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新增第一個欄位
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFields.length > 0 ? (
              filteredFields.sort((a, b) => a.order - b.order).map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onEdit={() => {
                    setEditingField(field);
                    setDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteField(field.id)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Card className="p-12 text-center">
                  <Settings2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-900 mb-2">
                    尚未設定 {VENDOR_TYPE_LABELS[selectedVendorType]} 欄位
                  </h3>
                  <p className="text-gray-600 mb-4">
                    為 {VENDOR_TYPE_LABELS[selectedVendorType]} 新增自定義欄位
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增欄位
                  </Button>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog */}
      <CustomFieldDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingField(null);
          }
        }}
        editingField={editingField}
        onSubmit={editingField ? handleUpdateField : handleCreateField}
      />
    </div>
  );
}

interface FieldCardProps {
  field: CustomField;
  onEdit: () => void;
  onDelete: () => void;
}

function FieldCard({ field, onEdit, onDelete }: FieldCardProps) {
  const vendorTypeColors = {
    shipping: 'bg-blue-100 text-blue-700',
    trucking: 'bg-green-100 text-green-700',
    customs: 'bg-orange-100 text-orange-700',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-gray-900">{field.name}</h3>
            {field.isRequired && (
              <Badge variant="destructive" className="text-xs">必填</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={vendorTypeColors[field.vendorType]}>
              {VENDOR_TYPE_LABELS[field.vendorType]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {FIELD_TYPE_LABELS[field.fieldType]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {field.fieldType === 'select' && field.options && field.options.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">選項：</div>
          <div className="flex flex-wrap gap-1">
            {field.options.map((option, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        排序：第 {field.order} 個
      </div>
    </Card>
  );
}
