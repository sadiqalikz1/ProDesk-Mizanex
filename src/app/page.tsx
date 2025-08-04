import AppLinks from '@/components/app-links';
import TaskManager from '@/components/task-manager';
import NotePad from '@/components/note-pad';
import QuickView from '@/components/quick-view';
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function Home() {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-4">
                <AppLinks />
                <NotePad />
              </div>
              <div className="space-y-6 lg:col-span-8">
                <TaskManager />
                <QuickView />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
