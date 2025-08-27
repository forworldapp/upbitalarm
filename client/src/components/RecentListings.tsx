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

export default function RecentListings() {
  const { data: listings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings/recent"],
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 공시</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 공시</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">최근 상장 공시</h2>
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
        <h2 className="text-lg font-semibold text-gray-900">최근 상장 공시</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {listings.map((listing) => {
            const status = getListingStatus(listing);
            const coinColor = getCoinColor(listing.symbol);
            const backgroundClass = status.label === "NEW" 
              ? "bg-green-50 border-green-200" 
              : status.label === "LISTED" 
                ? "bg-blue-50 border-blue-200" 
                : "bg-gray-50 border-gray-200";
            
            return (
              <div key={listing.id} className={`flex items-center justify-between p-4 border rounded-lg ${backgroundClass}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 ${coinColor} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-semibold text-sm">
                      {listing.symbol.slice(0, 4)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{listing.name}</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{getExchangeName(listing.exchange)}</span> • 
                      <span className="ml-1">{formatTimeAgo(listing.listedAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    {listing.priceChangePercent && (
                      <span className={`font-semibold ${parseFloat(listing.priceChangePercent) >= 0 ? 'text-success' : 'text-error'}`}>
                        {parseFloat(listing.priceChangePercent) >= 0 ? '+' : ''}{listing.priceChangePercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button className="text-primary hover:text-blue-700 font-medium text-sm inline-flex items-center">
            모든 상장 내역 보기 
            <ArrowRight className="ml-1 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
