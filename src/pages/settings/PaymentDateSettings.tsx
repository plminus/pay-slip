import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/hooks/useCompanySettings";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function PaymentDateSettings() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();
  const [paymentDay, setPaymentDay] = useState<number>(25);

  useEffect(() => {
    if (settings) {
      setPaymentDay(settings.paymentDay);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ paymentDay });
      toast.success("支給日設定を保存しました");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">支給日設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">毎月の支給日</label>
            <p className="text-muted-foreground text-sm">
              給与明細作成時にデフォルトの支給日として使用されます
            </p>
            <Select
              value={String(paymentDay)}
              onValueChange={(v) => setPaymentDay(Number(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}日
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
