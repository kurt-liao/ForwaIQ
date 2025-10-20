import { useState, useRef } from 'react';
import { Mail } from 'lucide-react';
import { InquiryForm } from '../components/inquiry/InquiryForm';
import { VendorSelection } from '../components/vendors/VendorSelection';

export function InquiryPage() {
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    vendorType: 'all',
    origin: '',
    destination: '',
    containerSize: '40HQ',
    cargoType: '',
    pickupLocation: '',
    deliveryLocation: '',
    customsType: '出口報關',
    productCategory: '',
    quantity: '',
    targetDate: '',
    additionalInfo: '',
  });

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const handleFormSubmit = () => {
    // Check if form is valid
    if (formRef.current) {
      const isValid = formRef.current.checkValidity();
      if (!isValid) {
        // Trigger browser validation UI
        formRef.current.reportValidity();
      }
      return isValid;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-gray-900">批次詢價</h1>
              <p className="text-sm text-gray-500">一次向多個供應商發送詢價郵件</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <InquiryForm formData={formData} setFormData={setFormData} formRef={formRef} />
          </div>

          {/* Right: Vendor Selection */}
          <div>
            <VendorSelection
              selectedVendors={selectedVendors}
              setSelectedVendors={setSelectedVendors}
              vendorType={formData.vendorType}
              formData={formData}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
