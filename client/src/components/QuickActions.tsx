import { useMutation } from "@tanstack/react-query";
import { Search, Play, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const { toast } = useToast();

  const forceCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/monitor/force", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "강제 모니터링 완료",
        description: "최신 상장 정보를 확인했습니다.",
      });
    },
    onError: () => {
      toast({
        title: "모니터링 실패",
        description: "강제 모니터링 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const testAlertMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/alerts/test", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "알림 테스트 완료",
        description: "알림 시스템이 정상적으로 작동합니다.",
      });
    },
    onError: () => {
      toast({
        title: "알림 테스트 실패",
        description: "알림 테스트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Force Check */}
        <Button
          onClick={() => forceCheckMutation.mutate()}
          disabled={forceCheckMutation.isPending}
          className="flex flex-col items-center p-4 h-auto bg-blue-600 hover:bg-blue-700"
          data-testid="button-force-check"
        >
          <Search className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">즉시 확인</span>
          <span className="text-xs opacity-75">
            {forceCheckMutation.isPending ? "확인 중..." : "지금 모니터링"}
          </span>
        </Button>

        {/* Test Alert */}
        <Button
          onClick={() => testAlertMutation.mutate()}
          disabled={testAlertMutation.isPending}
          variant="outline"
          className="flex flex-col items-center p-4 h-auto border-orange-300 text-orange-700 hover:bg-orange-50"
          data-testid="button-test-alert"
        >
          <Bell className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">알림 테스트</span>
          <span className="text-xs opacity-75">
            {testAlertMutation.isPending ? "테스트 중..." : "알림 확인"}
          </span>
        </Button>

        {/* Settings Shortcut */}
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto border-gray-300 text-gray-700 hover:bg-gray-50"
          data-testid="button-settings"
          onClick={() => {
            // Scroll to notification settings
            const settingsElement = document.querySelector('[data-testid="notification-settings"]');
            if (settingsElement) {
              settingsElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <Settings className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">설정</span>
          <span className="text-xs opacity-75">알림 설정</span>
        </Button>

        {/* Monitoring Status */}
        <div className="flex flex-col items-center p-4 h-auto bg-green-50 border border-green-200 rounded-md">
          <div className="w-6 h-6 mb-2 bg-green-500 rounded-full flex items-center justify-center">
            <Play className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-green-800">실시간 모니터링</span>
          <span className="text-xs text-green-600">활성화됨</span>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800 text-sm">
          <strong>💡 팁:</strong> "즉시 확인" 버튼으로 언제든지 수동으로 최신 상장 정보를 확인할 수 있습니다. 
          실시간 모니터링은 1분마다 자동으로 실행됩니다.
        </p>
      </div>
    </div>
  );
}