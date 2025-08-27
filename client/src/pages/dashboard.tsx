import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import RecentListings from "@/components/RecentListings";
import NotificationSettings from "@/components/NotificationSettings";
import ApiStatus from "@/components/ApiStatus";
import HistoricalData from "@/components/HistoricalData";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentListings />
          </div>
          
          <div className="space-y-6">
            <NotificationSettings />
            <ApiStatus />
          </div>
        </div>
        
        <div className="mt-8">
          <HistoricalData />
        </div>
      </div>
    </div>
  );
}
