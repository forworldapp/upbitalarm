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
      <div className="mb-4 bg-green-100 border border-green-300 rounded p-3">
        <div className="flex items-center">
          <CheckCircle2 className="text-green-600 w-4 h-4 mr-2" />
          <span className="text-green-800 text-sm font-medium">실시간 모니터링 중 - 신규 상장 공시 감지 시 즉시 알림</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {immediateAlerts.map((listing) => (
        <div
          key={listing.id}
          className="mb-2 bg-red-500 text-white rounded-lg p-3 animate-pulse shadow-lg border-l-4 border-yellow-400"
          data-testid={`alert-${listing.symbol}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-300" />
              <div>
                <h3 className="font-bold text-sm">
                  {listing.isAnnouncement ? "📢 상장공시" : "신규상장"}: {listing.symbol} - {listing.exchange === "upbit" ? "업비트" : "빗썸"}
                </h3>
                <p className="text-xs opacity-90">
                  {formatTimeAgo(listing.listedAt)} | 
                  {listing.isAnnouncement ? "공시" : listing.marketId}
                </p>
              </div>
            </div>
            <div className="text-xs font-mono bg-red-600 px-2 py-1 rounded">
              즉시 확인
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}