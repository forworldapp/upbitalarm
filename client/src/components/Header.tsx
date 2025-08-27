import { useQuery } from "@tanstack/react-query";
import { ChartLine, Settings, Cog } from "lucide-react";

interface DashboardStats {
  lastCheck: number;
  upbitStatus: {
    status: string;
  };
  bithumbStatus: {
    status: string;
  };
}

export default function Header() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "알 수 없음";
    
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000 / 60); // minutes
    
    if (diff < 1) return "방금 전";
    if (diff < 60) return `${diff}분 전`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "degraded":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ChartLine className="text-primary text-xl" />
              <h1 className="text-xl font-semibold text-gray-900">Crypto Listing Monitor</h1>
            </div>
            
            {/* System Status Indicators */}
            <div className="hidden md:flex items-center space-x-3 ml-6">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor(stats?.upbitStatus?.status || "unknown")}`}></div>
                <span className="text-sm text-gray-600">Upbit API</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor(stats?.bithumbStatus?.status || "unknown")}`}></div>
                <span className="text-sm text-gray-600">Bithumb API</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Status */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">마지막 체크:</span>
              <span className="text-sm font-mono text-gray-900">
                {formatTimeAgo(stats?.lastCheck || 0)}
              </span>
            </div>
            
            {/* Settings Button */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Cog className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
