
import { Suspense } from 'react';
import ImportVerificationClient from '@/components/file-tracker/import-verification-client';
import { Skeleton } from '@/components/ui/skeleton';

function ImportVerificationPage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
             <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                <ImportVerificationClient />
            </Suspense>
        </div>
    )
}

export default ImportVerificationPage;
