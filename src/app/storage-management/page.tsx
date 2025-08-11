
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import TaxonomyManager from '@/components/file-tracker/taxonomy-manager';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function StorageManagementPage() {
  return (
    <SidebarProvider>
      <div className="relative flex w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-11/12 space-y-8">
               <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Taxonomy Management</h1>
                <Button asChild variant="outline">
                  <Link href="/physical-file-tracker">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to File Tracker
                  </Link>
                </Button>
              </div>
              <TaxonomyManager />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
