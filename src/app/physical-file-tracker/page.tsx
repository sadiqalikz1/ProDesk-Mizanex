
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import QuickAddToFile from '@/components/file-tracker/quick-add-to-file';
import { CreateFile } from '@/components/file-tracker/create-file';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhysicalFileTracker from '@/components/file-tracker/physical-file-tracker';
import FileLog from '@/components/file-tracker/file-log';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutGrid, Warehouse } from 'lucide-react';
import BackupRestore from '@/components/file-tracker/backup-restore';
import { Skeleton } from '@/components/ui/skeleton';
import { FileTrackerProvider } from '@/context/file-tracker-context';

function PhysicalFileTrackerPageContent() {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <BackupRestore />
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/storage-view">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Diagram View
            </Link>
          </Button>
          <Button asChild>
            <Link href="/storage-management">
              <Warehouse className="mr-2 h-4 w-4" />
              Manage Storage
            </Link>
          </Button>
        </div>
      </div>
      <CreateFile />
      <QuickAddToFile />
      <Tabs defaultValue="file-list">
        <TabsList>
          <TabsTrigger value="file-list">File List</TabsTrigger>
          <TabsTrigger value="history-log">History Log</TabsTrigger>
        </TabsList>
        <TabsContent value="file-list">
          <PhysicalFileTracker />
        </TabsContent>
        <TabsContent value="history-log">
          <FileLog />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function PhysicalFileTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <Skeleton className="h-full w-full" />
       </div>
    )
  }

  return (
    <FileTrackerProvider>
      <SidebarProvider>
        <div className="relative flex w-full">
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
              <div className="mx-auto w-11/12 space-y-8">
                <PhysicalFileTrackerPageContent />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FileTrackerProvider>
  );
}
