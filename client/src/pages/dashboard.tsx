import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import RecentListings from "@/components/RecentListings";
import NotificationSettings from "@/components/NotificationSettings";
import ApiStatus from "@/components/ApiStatus";
import RealTimeAlerts from "@/components/RealTimeAlerts";
import QuickActions from "@/components/QuickActions";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time alerts banner */}
        <RealTimeAlerts />
        
        {/* Quick action buttons */}
        <QuickActions />
        
        {/* Main dashboard stats */}
        <Dashboard />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Focused on recent listings - smaller list */}
          <div>
            <RecentListings limit={5} />
          </div>
          
          {/* Settings and status */}
          <div className="space-y-6">
            <NotificationSettings />
            <ApiStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
