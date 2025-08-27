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
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-base font-semibold text-gray-900 mb-3">즉시 확인</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Force Check */}
        <Button
          onClick={() => forceCheckMutation.mutate()}
          disabled={forceCheckMutation.isPending}
          className="flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700"
          data-testid="button-force-check"
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {forceCheckMutation.isPending ? "확인 중..." : "즉시 확인"}
          </span>
        </Button>

        {/* Test Alert */}
        <Button
          onClick={() => testAlertMutation.mutate()}
          disabled={testAlertMutation.isPending}
          variant="outline"
          className="flex items-center justify-center p-3 border-gray-300"
          data-testid="button-test-alert"
        >
          <Bell className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {testAlertMutation.isPending ? "테스트 중..." : "알림 테스트"}
          </span>
        </Button>
      </div>
    </div>
  );
}