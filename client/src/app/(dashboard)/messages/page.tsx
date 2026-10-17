"use client";

import { FileText, History, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { ComposeMessage } from "@/features/messages/components/ComposeMessage";
import { MessageLog } from "@/features/messages/components/MessageLog";
import { TemplatesPanel } from "@/features/messages/components/TemplatesPanel";
import { useUrlTab } from "@/hooks/use-url-state";

const TABS = ["compose", "log", "templates"] as const;

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useUrlTab("compose", TABS);
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="WhatsApp and SMS to parents and staff, with templates and a log of everything sent." />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="compose">
            <Send />
            New message
          </TabsTrigger>
          <TabsTrigger value="log">
            <History />
            Send log
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText />
            Templates
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compose">
          <ComposeMessage />
        </TabsContent>
        <TabsContent value="log">
          <MessageLog />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
