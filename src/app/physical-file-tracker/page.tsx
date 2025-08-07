
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import PhysicalFileTracker from '@/components/file-tracker/physical-file-tracker';
import QuickAddToFile from '@/components/file-tracker/quick-add-to-file';

export default function PhysicalFileTrackerPage() {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full flex-col">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              <QuickAddToFile />
              <PhysicalFileTracker />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
