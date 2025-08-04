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
      <div className="relative flex min-h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
              <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  <AppLinks />
                  <NotePad />
                </div>
                <TaskManager />
              </div>
              <QuickView />
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}