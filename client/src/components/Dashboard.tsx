import { useQuery } from "@tanstack/react-query";
import { Eye, PlusCircle, Bell, Server } from "lucide-react";

interface DashboardStats {
  totalMonitored: number;
  newListingsToday: number;
  notificationsSent: number;
  uptime: string;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Total Monitored */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">모니터링 중</p>
            <p className="text-2xl font-semibold text-gray-900">{stats?.totalMonitored || 0}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Eye className="text-primary" />
          </div>
        </div>
      </div>

      {/* New Listings Today */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">오늘 신규 상장</p>
            <p className="text-2xl font-semibold text-success">{stats?.newListingsToday || 0}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <PlusCircle className="text-success" />
          </div>
        </div>
      </div>

      {/* Notifications Sent */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">발송된 알림</p>
            <p className="text-2xl font-semibold text-gray-900">{stats?.notificationsSent || 0}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Bell className="text-warning" />
          </div>
        </div>
      </div>

      {/* System Uptime */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">시스템 가동시간</p>
            <p className="text-2xl font-semibold text-gray-900">{stats?.uptime || "99.8%"}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <Server className="text-success" />
          </div>
        </div>
      </div>
    </div>
  );
}
