

import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import QuickAddToFile from '@/components/file-tracker/quick-add-to-file';
import { CreateFile } from '@/components/file-tracker/create-file';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhysicalFileTracker from '@/components/file-tracker/physical-file-tracker';
import FileLog from '@/components/file-tracker/file-log';

export default function PhysicalFileTrackerPage() {
  return (
    <SidebarProvider>
      <div className="relative flex w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex h-screen flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-11/12 space-y-8">
              <div className="space-y-8">
                <CreateFile />
                <QuickAddToFile />
              </div>
              <Tabs defaultValue="file-list">
                <TabsList>
                  <TabsTrigger value="file-list">File List</TabsTrigger>
                  <TabsTrigger value="history-log">History Log</TabsTrigger>
                </TabsList>
                <TabsContent value="file-list">
                  <PhysicalFileTracker />
                </TabsContent>
                <TabsContent value="history-log">
                  <FileLog />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
