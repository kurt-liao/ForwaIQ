import { useState, useEffect } from "react";
import {
  Home,
  FileText,
  Users,
  Mail,
  Menu,
  Settings2,
} from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { QuotesPage } from "./pages/QuotesPage";
import { VendorsPage } from "./pages/VendorsPage";
import { InquiryPage } from "./pages/InquiryPage";
import { CustomFieldsPage } from "./pages/CustomFieldsPage";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";

export interface Quote {
  id: string;
  vendorName: string;
  vendorType: "shipping" | "trucking" | "customs";
  price: number;
  currency: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;

  // Shipping specific
  origin?: string;
  destination?: string;
  carrier?: string;
  transitTime?: string;
  containerSize?: string;

  // Trucking specific
  pickupLocation?: string;
  deliveryLocation?: string;
  truckType?: string;

  // Customs specific
  customsType?: string;
  productCategory?: string;

  notes?: string;

  // Custom fields
  customFields?: Record<string, any>;
}

export interface VendorContact {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  type: "shipping" | "trucking" | "customs";
  contacts: VendorContact[];
  address?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  vendorType: string;
  origin: string;
  destination: string;
  containerSize: string;
  minPrice: string;
  maxPrice: string;
  searchTerm: string;
}

const navigation = [
  { name: "數據儀表板", icon: Home, id: "dashboard" },
  { name: "報價管理", icon: FileText, id: "quotes" },
  { name: "供應商管理", icon: Users, id: "vendors" },
  { name: "批次詢價", icon: Mail, id: "inquiry" },
  { name: "欄位設定", icon: Settings2, id: "custom-fields" },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set HTML lang attribute to Chinese
  useEffect(() => {
    document.documentElement.lang = "zh-TW";
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "quotes":
        return <QuotesPage />;
      case "vendors":
        return <VendorsPage />;
      case "inquiry":
        return <InquiryPage />;
      case "custom-fields":
        return <CustomFieldsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Sidebar */}
        <Sidebar>
          <SidebarContent>
            {/* Logo/Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center">
                <img 
                  src="/forwaIQ_logo.png" 
                  alt="ForwaIQ Logo" 
                  className="w-14 h-14"
                />
                <h2 className="text-gray-900 text-xl font-semibold">ForwaIQ</h2>
              </div>
            </div>

            {/* Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>主要功能</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() =>
                            setCurrentPage(item.id)
                          }
                          isActive={currentPage === item.id}
                          className="w-full"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Info Section */}
            <div className="mt-auto p-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-900 mb-1">
                  💡 提示
                </div>
                <p className="text-xs text-blue-700">
                  記得定期更新報價有效期限，保持資料的準確性
                </p>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-2 p-4 bg-white border-b border-gray-200">
            <SidebarTrigger>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SidebarTrigger>
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">
                F
              </span>
            </div>
            <h1 className="text-gray-900">ForwaIQ</h1>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </SidebarProvider>
  );
}