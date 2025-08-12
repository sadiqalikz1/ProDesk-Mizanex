
'use client';
import { getDatabase, ref, remove } from 'firebase/database';
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
import { Entry } from './types';

export function DeleteFileDialog({
  isOpen,
  setIsOpen,
  entry,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
}) {
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    await remove(entryRef);
    
    toast({
      title: 'File Deleted',
      description: `File ${entry.fileNo} has been permanently deleted.`,
      variant: 'destructive',
    });
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the file record for{' '}
            <span className="font-bold">{entry.fileNo}</span>. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirmDelete} variant="destructive">Confirm Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
