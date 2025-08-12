
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import StorageDiagram from '@/components/file-tracker/storage-diagram';

export default function StorageDiagramPage() {
  return (
    <SidebarProvider>
      <div className="relative flex w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-full space-y-8">
               <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Storage Diagram</h1>
                <Button asChild variant="outline">
                  <Link href="/physical-file-tracker">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to File Tracker
                  </Link>
                </Button>
              </div>
              <Separator />
              <StorageDiagram />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
