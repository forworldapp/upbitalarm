import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type Listing } from "@shared/schema";

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExchangeName(exchange: string) {
  return exchange === "upbit" ? "업비트" : "빗썸";
}

function getExchangeColor(exchange: string) {
  return exchange === "upbit" 
    ? "bg-blue-100 text-blue-800" 
    : "bg-yellow-100 text-yellow-800";
}

function getCoinColor(symbol: string) {
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

function formatPrice(price: string | null) {
  if (!price) return "-";
  const numPrice = parseFloat(price);
  return `₩${numPrice.toLocaleString()}`;
}

export default function HistoricalData() {
  const [exchangeFilter, setExchangeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: allListings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Filter and search listings
  const filteredListings = allListings?.filter((listing) => {
    const matchesExchange = exchangeFilter === "all" || listing.exchange === exchangeFilter;
    const matchesSearch = !searchQuery || 
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesExchange && matchesSearch;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">상장 내역</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
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
          <h2 className="text-lg font-semibold text-gray-900">상장 내역</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          상장 내역을 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">상장 내역</h2>
        <div className="flex items-center space-x-4">
          <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="모든 거래소" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 거래소</SelectItem>
              <SelectItem value="upbit">업비트</SelectItem>
              <SelectItem value="bithumb">빗썸</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="코인 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48"
          />
        </div>
      </div>
      
      {filteredListings.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          {searchQuery || exchangeFilter ? "검색 결과가 없습니다." : "상장 내역이 없습니다."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상장일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    초기 가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변동률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedListings.map((listing) => {
                  const coinColor = getCoinColor(listing.symbol);
                  const exchangeColor = getExchangeColor(listing.exchange);
                  
                  return (
                    <tr key={listing.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${coinColor} rounded-full flex items-center justify-center mr-3`}>
                            <span className="text-white font-semibold text-xs">
                              {listing.symbol.slice(0, 4)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                            <div className="text-sm text-gray-500 font-mono">{listing.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${exchangeColor}`}>
                          {getExchangeName(listing.exchange)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatDateTime(listing.listedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatPrice(listing.initialPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatPrice(listing.currentPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.priceChangePercent ? (
                          <span className={`font-semibold ${parseFloat(listing.priceChangePercent) >= 0 ? 'text-success' : 'text-error'}`}>
                            {parseFloat(listing.priceChangePercent) >= 0 ? '+' : ''}{listing.priceChangePercent}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 <span className="font-medium">{filteredListings.length}</span>개 결과 중{" "}
                <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, filteredListings.length)}</span>개 표시
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <span className="px-3 py-1 text-sm font-medium text-gray-900">
                  {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
