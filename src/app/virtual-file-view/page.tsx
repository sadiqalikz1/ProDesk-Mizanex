
import Header from '@/components/header';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import VirtualFileView from '@/components/file-tracker/virtual-file-view';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, View, Rows } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShelfView from '@/components/file-tracker/shelf-view';

export default function VirtualFileViewPage() {
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
                <h1 className="text-2xl font-bold">Virtual File View</h1>
                <Button asChild variant="outline">
                  <Link href="/physical-file-tracker">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to File Tracker
                  </Link>
                </Button>
              </div>
              <Tabs defaultValue="list-view">
                <TabsList>
                  <TabsTrigger value="list-view">
                    <Rows className="mr-2 h-4 w-4" /> List View
                  </TabsTrigger>
                  <TabsTrigger value="shelf-view">
                    <View className="mr-2 h-4 w-4" /> Shelf View
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="list-view">
                  <VirtualFileView />
                </TabsContent>
                <TabsContent value="shelf-view">
                  <ShelfView />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
