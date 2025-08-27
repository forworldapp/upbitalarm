import { useQuery, useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MessageCircle, MessageSquare } from "lucide-react";
import { type NotificationSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NotificationSettings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "설정이 저장되었습니다",
        description: "알림 설정이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (field: keyof NotificationSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const handlePollingIntervalChange = (value: string) => {
    updateSettingsMutation.mutate({ pollingInterval: parseInt(value) });
  };

  const handleFilterChange = (field: keyof NotificationSettings, checked: boolean) => {
    updateSettingsMutation.mutate({ [field]: checked });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">알림 설정</h2>
        </div>
        <div className="p-6 space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">알림 설정</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          설정을 불러오는데 실패했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200" data-testid="notification-settings">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">알림 설정</h2>
        <p className="text-sm text-gray-600 mt-1">실시간 알림 및 모니터링 설정</p>
      </div>
      <div className="p-6 space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">이메일</span>
          </div>
          <Switch
            checked={settings.email || false}
            onCheckedChange={(checked) => handleToggle("email", checked)}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {/* Telegram Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">텔레그램</span>
          </div>
          <Switch
            checked={settings.telegram || false}
            onCheckedChange={(checked) => handleToggle("telegram", checked)}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {/* Discord Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">디스코드</span>
          </div>
          <Switch
            checked={settings.discord || false}
            onCheckedChange={(checked) => handleToggle("discord", checked)}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        <hr className="my-4" />

        {/* Polling Interval - Real-time focused */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            모니터링 간격 <span className="text-red-600 text-xs">(빠를수록 좋음)</span>
          </label>
          <Select
            value={settings.pollingInterval?.toString() || "60"}
            onValueChange={handlePollingIntervalChange}
            disabled={updateSettingsMutation.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30초 (초고속)</SelectItem>
              <SelectItem value="60">1분 (고속)</SelectItem>
              <SelectItem value="120">2분 (빠름)</SelectItem>
              <SelectItem value="300">5분 (보통)</SelectItem>
              <SelectItem value="600">10분 (느림)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            더 빠른 간격일수록 신규 상장을 더 빨리 감지합니다
          </p>
        </div>

        {/* Notification Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">필터 설정</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-major"
                checked={settings.filterMajorCoinsOnly || false}
                onCheckedChange={(checked) => handleFilterChange("filterMajorCoinsOnly", !!checked)}
                disabled={updateSettingsMutation.isPending}
              />
              <label htmlFor="filter-major" className="text-sm text-gray-700">
                메이저 코인만
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
