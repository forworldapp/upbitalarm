import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { type Listing } from "@shared/schema";

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const listingDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "방금 전";
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  
  return `${Math.floor(diffInHours / 24)}일 전`;
}

export default function RealTimeAlerts() {
  const { data: recentListings } = useQuery<Listing[]>({
    queryKey: ["/api/listings/recent"],
    refetchInterval: 5000, // Check every 5 seconds for new alerts
  });

  // Get only very recent listings (within last 30 minutes) for immediate alerts
  const immediateAlerts = recentListings?.filter(listing => {
    const now = new Date();
    const listingTime = new Date(listing.listedAt);
    const diffInMinutes = (now.getTime() - listingTime.getTime()) / (1000 * 60);
    return diffInMinutes <= 30; // Show alerts for listings within 30 minutes
  }) || [];

  if (immediateAlerts.length === 0) {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle2 className="text-green-500 w-5 h-5 mr-3" />
          <div>
            <h3 className="text-green-800 font-semibold">모니터링 활성화</h3>
            <p className="text-green-700 text-sm">업비트와 빗썸의 신규 상장을 실시간으로 모니터링 중입니다. 새로운 상장이 감지되면 즉시 알림을 받게 됩니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {immediateAlerts.map((listing) => (
        <div
          key={listing.id}
          className="mb-3 bg-red-50 border border-red-200 rounded-lg p-4 animate-pulse shadow-lg"
          data-testid={`alert-${listing.symbol}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 w-6 h-6 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-bold text-lg">
                  🚨 신규 상장 알림: {listing.name} ({listing.symbol})
                </h3>
                <p className="text-red-700 text-sm mt-1">
                  <span className="font-semibold">
                    {listing.exchange === "upbit" ? "업비트" : "빗썸"}
                  </span>
                  에 {formatTimeAgo(listing.listedAt)} 상장되었습니다!
                </p>
                <p className="text-red-600 text-xs mt-1">
                  마켓 ID: {listing.marketId}
                </p>
              </div>
            </div>
            <div className="flex items-center text-red-500">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-xs font-mono">
                {formatTimeAgo(listing.listedAt)}
              </span>
            </div>
          </div>
          
          {/* Action suggestion */}
          <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
            <p className="text-red-800 text-sm font-medium">
              💡 <strong>추천 액션:</strong> 다른 거래소에서 {listing.symbol} 보유 중이라면 지금 즉시 출금하여 
              {listing.exchange === "upbit" ? "업비트" : "빗썸"}로 입금 후 매도를 고려하세요!
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}