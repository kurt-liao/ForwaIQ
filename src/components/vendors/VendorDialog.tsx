import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Star } from 'lucide-react';
import type { Vendor, VendorContact } from '../../App';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { setupFormValidation } from '../../utils/validation/formValidation';

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVendor?: Vendor | null;
  onSubmit: (vendor: any) => void;
}

export function VendorDialog({ open, onOpenChange, editingVendor, onSubmit }: VendorDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'shipping' as 'shipping' | 'trucking' | 'customs',
    address: '',
    rating: 5,
    notes: '',
  });

  const [contacts, setContacts] = useState<VendorContact[]>([
    { id: crypto.randomUUID(), name: '', title: '', email: '', phone: '', isPrimary: true }
  ]);

  const formRef = useRef<HTMLFormElement>(null);

  // Setup form validation
  useEffect(() => {
    if (open && formRef.current) {
      setupFormValidation(formRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (editingVendor) {
      setFormData({
        name: editingVendor.name,
        type: editingVendor.type,
        address: editingVendor.address || '',
        rating: editingVendor.rating || 5,
        notes: editingVendor.notes || '',
      });
      
      if (editingVendor.contacts && editingVendor.contacts.length > 0) {
        setContacts(editingVendor.contacts);
      } else {
        setContacts([
          { id: crypto.randomUUID(), name: '', title: '', email: '', phone: '', isPrimary: true }
        ]);
      }
    } else {
      resetForm();
    }
  }, [editingVendor, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'shipping',
      address: '',
      rating: 5,
      notes: '',
    });
    setContacts([
      { id: crypto.randomUUID(), name: '', title: '', email: '', phone: '', isPrimary: true }
    ]);
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      { id: crypto.randomUUID(), name: '', title: '', email: '', phone: '', isPrimary: false }
    ]);
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  const updateContact = (id: string, field: keyof VendorContact, value: any) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const setPrimaryContact = (id: string) => {
    setContacts(contacts.map(c => ({
      ...c,
      isPrimary: c.id === id
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out completely empty contacts
    const validContacts = contacts.filter(c => 
      c.name?.trim() || c.email?.trim() || c.phone?.trim()
    );
    
    const submitData = {
      ...formData,
      contacts: validContacts.length > 0 ? validContacts : []
    };

    if (editingVendor) {
      onSubmit({ ...editingVendor, ...submitData });
    } else {
      onSubmit(submitData);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl text-gray-900">{editingVendor ? '編輯供應商' : '新增供應商'}</h2>
            <p className="text-sm text-gray-500 mt-1">{editingVendor ? '更新供應商資訊' : '新增供應商到資料庫'}</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-gray-900">基本資訊</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">廠商名稱 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例：長榮海運"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">類型 *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="shipping">海運公司</option>
                  <option value="trucking">拖車公司</option>
                  <option value="customs">報關行</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">地址</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="例：台北市中山區..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">評分</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                  <option value={3}>⭐⭐⭐ (3)</option>
                  <option value={2}>⭐⭐ (2)</option>
                  <option value={1}>⭐ (1)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">聯絡人資訊</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
              >
                <Plus className="w-4 h-4 mr-2" />
                新增聯絡人
              </Button>
            </div>

            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">聯絡人 #{index + 1}</span>
                      {contact.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <Star className="w-3 h-3 fill-blue-700" />
                          主要聯絡人
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryContact(contact.id)}
                          className="text-xs text-gray-500 hover:text-blue-600"
                        >
                          設為主要
                        </button>
                      )}
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">姓名</label>
                      <Input
                        value={contact.name}
                        onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                        placeholder="例：王小明"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">職稱</label>
                      <Input
                        value={contact.title || ''}
                        onChange={(e) => updateContact(contact.id, 'title', e.target.value)}
                        placeholder="例：業務經理"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <Input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                        placeholder="例：contact@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">電話</label>
                      <Input
                        value={contact.phone || ''}
                        onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                        placeholder="例：02-1234-5678"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-4 border-t border-gray-200">
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
              {editingVendor ? '更新' : '新增'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
