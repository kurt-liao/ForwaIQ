import { useState, useEffect } from 'react';
import { Users, Send, AlertCircle, Mail } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import type { Vendor } from '../../App';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface VendorSelectionProps {
  selectedVendors: string[];
  setSelectedVendors: (vendors: string[]) => void;
  vendorType: string;
  formData: any;
  onSubmit?: () => boolean;
}

export function VendorSelection({ selectedVendors, setSelectedVendors, vendorType, formData, onSubmit }: VendorSelectionProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    // Clear selection when vendor type changes
    setSelectedVendors([]);
  }, [vendorType]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/vendors`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors
    .filter(v => vendorType === 'all' || v.type === vendorType)
    .filter(v => v.contacts && v.contacts.some(c => c.email)); // Only vendors with email

  const isAllSelected = filteredVendors.length > 0 && selectedVendors.length === filteredVendors.length;

  const toggleVendor = (id: string) => {
    if (selectedVendors.includes(id)) {
      setSelectedVendors(selectedVendors.filter(v => v !== id));
    } else {
      setSelectedVendors([...selectedVendors, id]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(v => v.id));
    }
  };

  const handleSend = async () => {
    // Validate form first if onSubmit callback is provided
    if (onSubmit && !onSubmit()) {
      return;
    }

    if (selectedVendors.length === 0) {
      toast.error('請至少選擇一個供應商');
      return;
    }

    try {
      // 準備詢價資料
      const inquiryData = {
        vendorIds: selectedVendors.map(id => parseInt(id)), // 轉換為數字 ID
        subject: formData.subject || '報價詢問',
        content: generateEmailContentForAPI(formData),
        inquiryData: formData,
      };

      console.log('發送詢價:', inquiryData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-368a4ded/send-inquiry`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inquiryData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // 顯示成功訊息
      const selectedVendorsList = filteredVendors.filter(v => selectedVendors.includes(v.id));
      
      toast.success(`詢價已成功發送至 ${result.sentTo || selectedVendors.length} 個供應商！`);
      
      // 清空選擇
      setSelectedVendors([]);
      
      console.log('發送結果:', result);
    } catch (error) {
      console.error('發送詢價失敗:', error);
      toast.error('發送詢價失敗，請稍後再試');
    }
  };

  const generateEmailContentForAPI = (data: any) => {
    let content = '';

    if (data.vendorType === 'shipping' || data.vendorType === 'all') {
      content += `📦 海運資訊：\n`;
      if (data.origin) content += `起運港: ${data.origin}\n`;
      if (data.destination) content += `目的港: ${data.destination}\n`;
      if (data.containerSize) content += `櫃型: ${data.containerSize}\n`;
      if (data.cargoType) content += `貨物類型: ${data.cargoType}\n`;
      content += `\n`;
    }

    if (data.vendorType === 'trucking' || data.vendorType === 'all') {
      content += `🚛 拖車資訊：\n`;
      if (data.pickupLocation) content += `取貨地點: ${data.pickupLocation}\n`;
      if (data.deliveryLocation) content += `送達地點: ${data.deliveryLocation}\n`;
      content += `\n`;
    }

    if (data.vendorType === 'customs' || data.vendorType === 'all') {
      content += `📋 報關資訊：\n`;
      if (data.customsType) content += `報關類型: ${data.customsType}\n`;
      if (data.productCategory) content += `產品類別: ${data.productCategory}\n`;
      content += `\n`;
    }

    if (data.quantity) content += `數量: ${data.quantity}\n`;
    if (data.targetDate) content += `目標日期: ${data.targetDate}\n`;
    if (data.additionalInfo) content += `\n補充說明:\n${data.additionalInfo}\n`;

    content += `\n請提供您的最佳報價，謝謝！`;

    return content;
  };

  const generateEmailContent = (data: any, vendors: Vendor[]) => {
    let content = `主旨: ${data.subject || '報價詢問'}\n\n`;
    content += `親愛的合作夥伴：\n\n`;
    content += `我們需要以下項目的報價：\n\n`;

    if (data.vendorType === 'shipping' || data.vendorType === 'all') {
      content += `📦 海運資訊：\n`;
      if (data.origin) content += `起運港: ${data.origin}\n`;
      if (data.destination) content += `目的港: ${data.destination}\n`;
      if (data.containerSize) content += `櫃型: ${data.containerSize}\n`;
      if (data.cargoType) content += `貨物類型: ${data.cargoType}\n`;
      content += `\n`;
    }

    if (data.vendorType === 'trucking' || data.vendorType === 'all') {
      content += `🚛 拖車資訊：\n`;
      if (data.pickupLocation) content += `取貨地點: ${data.pickupLocation}\n`;
      if (data.deliveryLocation) content += `送達地點: ${data.deliveryLocation}\n`;
      content += `\n`;
    }

    if (data.vendorType === 'customs' || data.vendorType === 'all') {
      content += `📋 報關資訊：\n`;
      if (data.customsType) content += `報關類型: ${data.customsType}\n`;
      if (data.productCategory) content += `產品類別: ${data.productCategory}\n`;
      content += `\n`;
    }

    if (data.quantity) content += `數量: ${data.quantity}\n`;
    if (data.targetDate) content += `目標日期: ${data.targetDate}\n`;
    if (data.additionalInfo) content += `\n補充說明:\n${data.additionalInfo}\n`;

    content += `\n請提供您的最佳報價，謝謝！\n`;
    
    // Collect all emails from vendor contacts
    const allEmails = vendors.flatMap(v => 
      (v.contacts || [])
        .filter(c => c.email)
        .map(c => `${c.name} <${c.email}>`)
    );
    content += `\n收件人: ${allEmails.join(', ')}`;

    return content;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">選擇供應商</h3>
          <button
            onClick={handleSelectAll}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            {isAllSelected ? '取消全選' : '全選'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">載入中...</div>
        )}

        {!loading && filteredVendors.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">無符合條件的供應商</p>
            <p className="text-xs text-gray-400 mt-1">或供應商缺少 Email 資訊</p>
          </div>
        )}

        {!loading && filteredVendors.length > 0 && (
          <div className="space-y-3">
            {filteredVendors.map((vendor) => {
              const primaryContact = vendor.contacts?.find(c => c.isPrimary) || vendor.contacts?.[0];
              const emailCount = vendor.contacts?.filter(c => c.email).length || 0;
              
              return (
                <div
                  key={vendor.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleVendor(vendor.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => toggleVendor(vendor.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{vendor.name}</div>
                    {primaryContact && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{primaryContact.email}</span>
                        </div>
                        {primaryContact.name && (
                          <div className="mt-0.5">{primaryContact.name}</div>
                        )}
                        {emailCount > 1 && (
                          <div className="text-blue-600 mt-0.5">+{emailCount - 1} 個聯絡人</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-4">
            已選擇 <span className="text-blue-600">{selectedVendors.length}</span> 個供應商
          </div>

          <Button
            onClick={handleSend}
            disabled={selectedVendors.length === 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            發送詢價郵件
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="space-y-2">
              <div>💡 使用提示：</div>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>填寫完整資訊可獲得更精準報價</li>
                <li>可複製郵件內容手動發送</li>
                <li>建議同時詢問 3-5 家比價</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
