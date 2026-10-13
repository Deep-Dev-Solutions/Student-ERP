"use client";

import { useState } from "react";
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
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PointOfSale, DefaultersTable } from "@/features/fees/components";

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("pos");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee collection"
        description="Take payments at the counter, issue receipts and follow up on overdue fees."
        actions={
          <>
            <Button variant="outline">
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
          <TabsTrigger value="defaulters">
            <AlertTriangle />
            Defaulters and arrears
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <PointOfSale />
        </TabsContent>
        <TabsContent value="defaulters">
          <DefaultersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
