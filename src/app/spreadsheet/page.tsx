import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import Spreadsheet from '@/components/spreadsheet';

export default function SpreadsheetPage() {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 sm:px-6 sm:py-4">
            <Spreadsheet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
