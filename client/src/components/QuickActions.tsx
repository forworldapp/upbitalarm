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

  const testAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/alerts/test-announcement", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings/recent"] });
      toast({
        title: "상장공시 테스트 완료",
        description: "테스트 상장공시 알림이 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "테스트 실패",
        description: "상장공시 테스트 중 오류가 발생했습니다.",
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

        {/* Test Announcement */}
        <Button
          onClick={() => testAnnouncementMutation.mutate()}
          disabled={testAnnouncementMutation.isPending}
          variant="outline"
          className="flex items-center justify-center p-3 border-orange-300 text-orange-700 hover:bg-orange-50"
          data-testid="button-test-announcement"
        >
          <Bell className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {testAnnouncementMutation.isPending ? "테스트 중..." : "공시 테스트"}
          </span>
        </Button>
      </div>
    </div>
  );
}