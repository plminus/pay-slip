import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsuranceRateSettings from "./InsuranceRateSettings";
import PaymentDateSettings from "./PaymentDateSettings";
import UserSettings from "./UserSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="設定"
        description="システム設定の管理を行います"
      />

      <Tabs defaultValue="insurance-rates">
        <TabsList>
          <TabsTrigger value="insurance-rates">保険料率設定</TabsTrigger>
          <TabsTrigger value="payment-date">支給日設定</TabsTrigger>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
        </TabsList>

        <TabsContent value="insurance-rates" className="mt-6">
          <InsuranceRateSettings />
        </TabsContent>

        <TabsContent value="payment-date" className="mt-6">
          <PaymentDateSettings />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <UserSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
