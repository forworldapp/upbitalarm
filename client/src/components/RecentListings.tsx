import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { type Listing } from "@shared/schema";

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const listingDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "방금 전";
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
}

function getExchangeName(exchange: string) {
  return exchange === "upbit" ? "업비트" : "빗썸";
}

function getListingStatus(listing: Listing) {
  const now = new Date();
  const listingDate = new Date(listing.listedAt);
  const diffInHours = (now.getTime() - listingDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return { label: "NEW", color: "bg-success text-white" };
  if (diffInHours < 24) return { label: "LISTED", color: "bg-primary text-white" };
  return { label: "STABLE", color: "bg-gray-500 text-white" };
}

function getCoinColor(symbol: string) {
  // Generate a consistent color based on symbol
  const colors = [
    "bg-orange-500", "bg-purple-500", "bg-green-500", "bg-blue-500", 
    "bg-red-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500"
  ];
  
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

interface RecentListingsProps {
  limit?: number;
}

export default function RecentListings({ limit = 10 }: RecentListingsProps) {
  const { data: allListings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings/recent"],
    refetchInterval: 30000, // Faster refresh for real-time feel
  });

  // Filter to show only listings from the past week and apply limit
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const listings = allListings?.filter(listing => {
    const listingDate = new Date(listing.listedAt);
    return listingDate >= oneWeekAgo;
  }).slice(0, limit);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 (일주일)</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 (일주일)</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          상장 정보를 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 (일주일)</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          최근 상장된 암호화폐가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">최근 상장 (일주일)</h2>
      </div>
      <div className="p-6">
        <div className="space-y-2">
          {listings.map((listing) => {
            const status = getListingStatus(listing);
            const coinColor = getCoinColor(listing.symbol);
            const backgroundClass = status.label === "NEW" 
              ? "bg-green-50 border-green-200" 
              : status.label === "LISTED" 
                ? "bg-blue-50 border-blue-200" 
                : "bg-gray-50 border-gray-200";
            
            return (
              <div key={listing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${coinColor} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-semibold text-xs">
                      {listing.symbol.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{listing.symbol}</h3>
                    <p className="text-xs text-gray-500">
                      {getExchangeName(listing.exchange)} • {listing.listedAt.toLocaleString("ko-KR", { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {listing.currentPrice ? (
                    <p className="font-semibold text-gray-900 text-sm">
                      ₩{Number(listing.currentPrice).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">시세 확인중</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
