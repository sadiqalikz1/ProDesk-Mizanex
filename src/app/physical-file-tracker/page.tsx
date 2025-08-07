
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import QuickAddToFile from '@/components/file-tracker/quick-add-to-file';

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
            <div className="space-y-8">
              <QuickAddToFile />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
