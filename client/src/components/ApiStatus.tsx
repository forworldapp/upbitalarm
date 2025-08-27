import { useQuery } from "@tanstack/react-query";

interface ApiStatusData {
  upbitStatus: {
    status: string;
    responseTime: number;
    rateLimit: number;
    rateLimitUsed: number;
  };
  bithumbStatus: {
    status: string;
    responseTime: number;
    rateLimit: number;
    rateLimitUsed: number;
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case "healthy":
      return "bg-success";
    case "error":
      return "bg-error";
    case "degraded":
      return "bg-warning";
    default:
      return "bg-gray-500";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "healthy":
      return "정상";
    case "error":
      return "오류";
    case "degraded":
      return "지연";
    default:
      return "알 수 없음";
  }
}

function getStatusTextColor(status: string) {
  switch (status) {
    case "healthy":
      return "text-success";
    case "error":
      return "text-error";
    case "degraded":
      return "text-warning";
    default:
      return "text-gray-500";
  }
}

export default function ApiStatus() {
  const { data: stats, isLoading } = useQuery<ApiStatusData>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">API 상태</h2>
        </div>
        <div className="p-6 space-y-4 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-300 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">API 상태</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          API 상태를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">API 상태</h2>
      </div>
      <div className="p-6 space-y-4">
        {/* Upbit API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(stats.upbitStatus.status)}`}></div>
            <span className="text-sm font-medium text-gray-900">Upbit API</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${getStatusTextColor(stats.upbitStatus.status)}`}>
              {getStatusText(stats.upbitStatus.status)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {stats.upbitStatus.responseTime}ms
            </p>
          </div>
        </div>

        {/* Bithumb API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(stats.bithumbStatus.status)}`}></div>
            <span className="text-sm font-medium text-gray-900">Bithumb API</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${getStatusTextColor(stats.bithumbStatus.status)}`}>
              {getStatusText(stats.bithumbStatus.status)}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {stats.bithumbStatus.responseTime}ms
            </p>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Upbit Rate Limit</span>
                <span className="font-mono">
                  {stats.upbitStatus.rateLimitUsed}/{stats.upbitStatus.rateLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.upbitStatus.rateLimitUsed / stats.upbitStatus.rateLimit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Bithumb Rate Limit</span>
                <span className="font-mono">
                  {stats.bithumbStatus.rateLimitUsed}/{stats.bithumbStatus.rateLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${(stats.bithumbStatus.rateLimitUsed / stats.bithumbStatus.rateLimit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
