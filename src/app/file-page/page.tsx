
import FilePageClient from '@/components/file-page-client';
import { FileTrackerProvider } from '@/context/file-tracker-context';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FilePage() {
  return (
    <FileTrackerProvider>
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Skeleton className="h-full w-full" /></div>}>
        <FilePageClient />
      </Suspense>
    </FileTrackerProvider>
  );
}
