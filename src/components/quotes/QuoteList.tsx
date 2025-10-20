import { useState, useEffect } from 'react';
import { Edit, Trash2, Ship, Truck, FileText, Calendar, DollarSign } from 'lucide-react';
import type { Quote } from '../../App';
import { Button } from '../ui/button';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import type { CustomField } from '../../pages/CustomFieldsPage';

interface QuoteListProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

export function QuoteList({ quotes, onEdit, onDelete }: QuoteListProps) {
  const [customFields, setCustomFields] = useState<Record<string, CustomField>>({});

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/custom-fields`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const fields: CustomField[] = await response.json();
        const fieldsMap: Record<string, CustomField> = {};
        fields.forEach(field => {
          fieldsMap[field.id] = field;
        });
        setCustomFields(fieldsMap);
      }
    } catch (error) {
      console.error('載入自定義欄位時發生錯誤:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipping':
        return <Ship className="w-4 h-4" />;
      case 'trucking':
        return <Truck className="w-4 h-4" />;
      case 'customs':
        return <FileText className="w-4 h-4" />;
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

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'shipping':
        return 'bg-blue-100 text-blue-700';
      case 'trucking':
        return 'bg-green-100 text-green-700';
      case 'customs':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        沒有符合條件的報價
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <div
          key={quote.id}
          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
            isExpired(quote.validUntil) ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTypeBgColor(quote.vendorType)}`}>
                  {getTypeIcon(quote.vendorType)}
                  {getTypeLabel(quote.vendorType)}
                </span>
                <h3 className="text-gray-900 truncate">{quote.vendorName}</h3>
              </div>

              {/* Route or Location Info */}
              {quote.vendorType === 'shipping' && quote.origin && quote.destination && (
                <div className="text-sm text-gray-600 mb-2">
                  {quote.origin} → {quote.destination}
                  {quote.containerSize && (
                    <span className="ml-2 text-gray-500">({quote.containerSize})</span>
                  )}
                </div>
              )}

              {quote.vendorType === 'trucking' && quote.pickupLocation && quote.deliveryLocation && (
                <div className="text-sm text-gray-600 mb-2">
                  {quote.pickupLocation} → {quote.deliveryLocation}
                </div>
              )}

              {quote.vendorType === 'customs' && quote.customsType && (
                <div className="text-sm text-gray-600 mb-2">
                  {quote.customsType}
                  {quote.productCategory && ` - ${quote.productCategory}`}
                </div>
              )}

              {/* Additional Info */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {quote.carrier && (
                  <span>船公司: {quote.carrier}</span>
                )}
                {quote.transitTime && (
                  <span>航程: {quote.transitTime}</span>
                )}
                {quote.truckType && (
                  <span>車型: {quote.truckType}</span>
                )}
              </div>

              {/* Custom Fields Display */}
              {quote.customFields && Object.keys(quote.customFields).length > 0 && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  {Object.entries(quote.customFields).map(([fieldId, value]) => {
                    if (value && customFields[fieldId]) {
                      return (
                        <div key={fieldId}>
                          <span className="font-medium">{customFields[fieldId].name}:</span> {String(value)}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {quote.notes && (
                <div className="text-xs text-gray-500 mt-2 truncate">
                  備註: {quote.notes}
                </div>
              )}
            </div>

            {/* Right: Price & Actions */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center justify-end gap-1 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div className="text-xl text-gray-900">
                  {quote.currency} ${quote.price.toLocaleString()}
                </div>
              </div>

              <div className={`text-xs flex items-center justify-end gap-1 mb-3 ${
                isExpired(quote.validUntil) ? 'text-red-600' : 'text-gray-500'
              }`}>
                <Calendar className="w-3 h-3" />
                {isExpired(quote.validUntil) ? '已過期' : '有效至'}: {new Date(quote.validUntil).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(quote)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(quote.id)}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
