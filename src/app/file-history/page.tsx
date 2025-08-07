
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import FileHistoryTracker from '@/components/file-tracker/file-history-tracker';

export default function FileHistoryPage() {
  return (
    <SidebarProvider>
      <div className="relative flex w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex h-screen flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <FileHistoryTracker />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
