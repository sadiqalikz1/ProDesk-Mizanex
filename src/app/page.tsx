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
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
            <div className="flex flex-col gap-4 md:gap-8 lg:flex-row">
              <div className="flex flex-col gap-4 md:gap-8 lg:w-2/3">
                <NotePad />
                <TaskManager />
              </div>
              <div className="lg:w-1/3">
                <QuickView />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
