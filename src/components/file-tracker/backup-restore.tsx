
'use client';
import { useRef } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DATA_ROOTS = ['entries', 'companies', 'docTypes', 'racksMetadata', 'shelvesMetadata'];

export default function BackupRestore() {
  const { toast } = useToast();
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    const db = getDatabase(app);
    const backupData: { [key: string]: any } = {};

    try {
      for (const root of DATA_ROOTS) {
        const snapshot = await get(ref(db, root));
        if (snapshot.exists()) {
          backupData[root] = snapshot.val();
        }
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const a = new Date();
      const datePart = `${a.getFullYear()}-${(a.getMonth() + 1).toString().padStart(2, '0')}-${a.getDate().toString().padStart(2, '0')}`;
      const timePart = `${a.getHours().toString().padStart(2, '0')}${a.getMinutes().toString().padStart(2, '0')}`;

      link.download = `prodesk-backup-${datePart}-${timePart}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Successful',
        description: 'All data has been downloaded.',
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: 'Backup Failed',
        description: 'An error occurred while creating the backup.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
        return;
    }
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                toast({ title: 'Restore Error', description: 'Could not read the file.', variant: 'destructive'});
                return;
            }
            
            const restoredData = JSON.parse(content);
            const db = getDatabase(app);

            // Clear existing data
            for (const root of DATA_ROOTS) {
                await set(ref(db, root), null);
            }
            
            // Set new data
            for (const root in restoredData) {
                if(DATA_ROOTS.includes(root)) {
                    await set(ref(db, root), restoredData[root]);
                }
            }

            toast({ title: 'Restore Successful', description: 'All data has been restored from the backup file.'});

        } catch (error) {
            console.error('Restore failed:', error);
            toast({ title: 'Restore Failed', description: 'The selected file is not a valid backup file.', variant: 'destructive'});
        } finally {
             if(restoreInputRef.current) {
                restoreInputRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleBackup} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Backup
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Restore
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all current data and replace it with the data from the backup file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreClick}>
                Continue & Select File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <input 
        type="file" 
        ref={restoreInputRef} 
        onChange={handleFileSelected} 
        className="hidden" 
        accept=".json" 
      />
    </div>
  );
}
