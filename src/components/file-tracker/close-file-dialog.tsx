
'use client';
import { getDatabase, ref, update } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';

export function CloseFileDialog({
  isOpen,
  setIsOpen,
  entry,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
}) {
  const { toast } = useToast();

  const handleConfirmClose = async () => {
    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    const closeHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Box: ${entry.boxNo}`,
      status: 'Closed',
      updatedBy: 'System', 
      notes: 'File has been marked as closed and archived.',
    };
    
    const updatedHistory = [...(entry.locationHistory || []), closeHistoryEntry];
    
    await update(entryRef, {
      status: 'Closed',
      locationHistory: updatedHistory,
    });
    
    toast({
      title: 'File Closed',
      description: `File ${entry.fileNo} has been archived.`,
    });
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to close this file?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the file as 'Closed' and it can no longer be updated. This is for archiving full files. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirmClose}>Confirm Close</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
