"use client";

import { useUrlTab } from "@/hooks/use-url-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  FileText,
  CalendarCheck,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PointOfSale, DefaultersTable, VouchersPanel, DailyClosing, FeeStructure } from "@/features/fees/components";

const TABS = ["pos", "vouchers", "defaulters", "closing", "structure"] as const;

export default function FeesPage() {
  const [activeTab, setActiveTab] = useUrlTab("pos", TABS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee collection"
        description="Take payments, generate vouchers, follow up on overdue fees and close the day's cash."
        actions={
          <>
            <Button variant="outline" onClick={() => setActiveTab("closing")}>
              <FileSpreadsheet data-icon="inline-start" />
              Daily cash report
            </Button>
            <Button onClick={() => setActiveTab("pos")}>
              <Receipt data-icon="inline-start" />
              Collect a fee
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="pos">
            <CreditCard />
            Counter
          </TabsTrigger>
          <TabsTrigger value="vouchers">
            <FileText />
            Vouchers
          </TabsTrigger>
          <TabsTrigger value="defaulters">
            <AlertTriangle />
            Defaulters and arrears
          </TabsTrigger>
          <TabsTrigger value="closing">
            <CalendarCheck />
            Daily closing
          </TabsTrigger>
          <TabsTrigger value="structure">
            <Layers />
            Fee structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <PointOfSale />
        </TabsContent>
        <TabsContent value="vouchers">
          <VouchersPanel />
        </TabsContent>
        <TabsContent value="defaulters">
          <DefaultersTable />
        </TabsContent>
        <TabsContent value="closing">
          <DailyClosing />
        </TabsContent>
        <TabsContent value="structure">
          <FeeStructure />
        </TabsContent>
      </Tabs>
    </div>
  );
}
