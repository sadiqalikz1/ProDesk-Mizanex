
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Suspense } from 'react';
import ImportVerificationClient from '@/components/file-tracker/import-verification-client';
import { Skeleton } from '@/components/ui/skeleton';

function ImportVerificationPage() {
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
        <div className="container mx-auto p-4 md:p-8">
             <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                <ImportVerificationClient />
            </Suspense>
        </div>
    )
}

export default ImportVerificationPage;
