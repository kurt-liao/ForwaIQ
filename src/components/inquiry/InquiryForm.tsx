import { useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { setupFormValidation } from '../../utils/validation/formValidation';

interface InquiryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function InquiryForm({ formData, setFormData, formRef }: InquiryFormProps) {
  const localFormRef = useRef<HTMLFormElement>(null);
  const activeFormRef = formRef || localFormRef;

  // Setup form validation
  useEffect(() => {
    if (activeFormRef.current) {
      setupFormValidation(activeFormRef.current);
    }
  }, []);

  return (
    <form ref={activeFormRef} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">詢價資訊</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">郵件主旨 *</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="例：基隆→寧波 40HQ 報價詢問"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">詢價類型</label>
            <select
              value={formData.vendorType}
              onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部類型</option>
              <option value="shipping">海運</option>
              <option value="trucking">拖車</option>
              <option value="customs">報關</option>
            </select>
          </div>

          {/* Shipping Fields */}
          {(formData.vendorType === 'shipping' || formData.vendorType === 'all') && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-900">海運資訊</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">起運港</label>
                  <Input
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="例：基隆港"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">目的港</label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="例：寧波港"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">櫃型</label>
                  <select
                    value={formData.containerSize}
                    onChange={(e) => setFormData({ ...formData, containerSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="20GP">20GP</option>
                    <option value="40GP">40GP</option>
                    <option value="40HQ">40HQ</option>
                    <option value="45HQ">45HQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">貨物類型</label>
                  <Input
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    placeholder="例：一般貨物"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trucking Fields */}
          {(formData.vendorType === 'trucking' || formData.vendorType === 'all') && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-900">拖車資訊</div>
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
            </div>
          )}

          {/* Customs Fields */}
          {(formData.vendorType === 'customs' || formData.vendorType === 'all') && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-900">報關資訊</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">報關類型</label>
                  <select
                    value={formData.customsType}
                    onChange={(e) => setFormData({ ...formData, customsType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">數量</label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="例：1櫃"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">目標日期</label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">補充說明</label>
            <Textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              rows={4}
              placeholder="其他需要說明的資訊..."
            />
          </div>
        </div>
      </div>
    </form>
  );
}
