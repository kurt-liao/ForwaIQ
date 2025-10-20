import { Edit, Trash2, Ship, Truck, FileText, Mail, Phone, MapPin, Star, User } from 'lucide-react';
import type { Vendor } from '../../App';
import { Button } from '../ui/button';

interface VendorTableProps {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

export function VendorTable({ vendors, onEdit, onDelete }: VendorTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipping':
        return <Ship className="w-4 h-4 text-blue-600" />;
      case 'trucking':
        return <Truck className="w-4 h-4 text-green-600" />;
      case 'customs':
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'shipping':
        return '海運';
      case 'trucking':
        return '拖車';
      case 'customs':
        return '報關';
      default:
        return type;
    }
  };

  const getPrimaryContact = (vendor: Vendor) => {
    if (!vendor.contacts || vendor.contacts.length === 0) return null;
    return vendor.contacts.find(c => c.isPrimary) || vendor.contacts[0];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm text-gray-600">廠商名稱</th>
            <th className="px-6 py-3 text-left text-sm text-gray-600">類型</th>
            <th className="px-6 py-3 text-left text-sm text-gray-600">主要聯絡人</th>
            <th className="px-6 py-3 text-left text-sm text-gray-600">聯絡方式</th>
            <th className="px-6 py-3 text-left text-sm text-gray-600">評分</th>
            <th className="px-6 py-3 text-right text-sm text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {vendors.map((vendor) => {
            const primaryContact = getPrimaryContact(vendor);
            const totalContacts = vendor.contacts?.length || 0;
            
            return (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded flex-shrink-0">
                      {getTypeIcon(vendor.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-gray-900 truncate">{vendor.name}</div>
                      {vendor.address && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {getTypeLabel(vendor.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {primaryContact ? (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {primaryContact.name || '-'}
                      </div>
                      {primaryContact.title && (
                        <div className="text-xs text-gray-500">{primaryContact.title}</div>
                      )}
                      {totalContacts > 1 && (
                        <div className="text-xs text-blue-600">
                          +{totalContacts - 1} 個聯絡人
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {primaryContact ? (
                    <div className="space-y-1 text-sm">
                      {primaryContact.email && (
                        <div className="text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{primaryContact.email}</span>
                        </div>
                      )}
                      {primaryContact.phone && (
                        <div className="text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{primaryContact.phone}</span>
                        </div>
                      )}
                      {!primaryContact.email && !primaryContact.phone && (
                        <div className="text-gray-400">-</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-900">{vendor.rating || 5}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(vendor)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(vendor.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
