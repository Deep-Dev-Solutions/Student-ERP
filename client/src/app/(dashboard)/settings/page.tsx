"use client";

import { useState } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { CampusProfile, RolesMatrix } from "@/features/settings/components";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your school's profile and what each role is allowed to do."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="profile">
            <Building2 />
            Campus profile
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck />
            Roles and permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <CampusProfile />
        </TabsContent>
        <TabsContent value="roles">
          <RolesMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
