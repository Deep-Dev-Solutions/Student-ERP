"use client";

import { useUrlTab } from "@/hooks/use-url-state";
import { Building2, MapPin, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { BranchesPanel, CampusProfile, RolesMatrix, SchoolRulesPanel, UsersPanel } from "@/features/settings/components";

const TABS = ["profile", "branches", "users", "roles", "rules"] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useUrlTab("roles", TABS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your school's profile, campuses, who has access, what each role can do, and school-wide rules."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="profile">
            <Building2 />
            Campus profile
          </TabsTrigger>
          <TabsTrigger value="branches">
            <MapPin />
            Campuses
          </TabsTrigger>
          <TabsTrigger value="users">
            <UsersRound />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck />
            Roles and permissions
          </TabsTrigger>
          <TabsTrigger value="rules">
            <ScrollText />
            School rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <CampusProfile />
        </TabsContent>
        <TabsContent value="branches">
          <BranchesPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="roles">
          <RolesMatrix />
        </TabsContent>
        <TabsContent value="rules">
          <SchoolRulesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
