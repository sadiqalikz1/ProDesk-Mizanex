import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import SettingsPage from '@/components/settings-page';

export default function Settings() {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:px-6 sm:py-4">
            <SettingsPage />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
