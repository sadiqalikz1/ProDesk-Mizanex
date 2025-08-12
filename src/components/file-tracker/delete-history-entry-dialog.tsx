
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

type DeleteHistoryEntryDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
  historyEntry: LocationHistory;
  historyIndex: number;
};


export function DeleteHistoryEntryDialog({
  isOpen,
  setIsOpen,
  entry,
  historyEntry,
  historyIndex,
}: DeleteHistoryEntryDialogProps) {
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    const updatedHistory = [...(entry.locationHistory || [])];
    updatedHistory.splice(historyIndex, 1);
    
    await update(entryRef, {
      locationHistory: updatedHistory,
    });
    
    toast({
      title: 'History Entry Deleted',
      description: `The document record has been permanently deleted.`,
      variant: 'destructive',
    });
    setIsOpen(false);
  };
  
  const getDocNumber = (notes: string) => {
     const docNumberMatch = notes?.match(/#(\S+)/);
     return docNumberMatch ? docNumberMatch[1] : 'this entry';
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the history record for document{' '}
            <span className="font-bold">{getDocNumber(historyEntry?.notes)}</span> from file <span className='font-bold'>{entry.fileNo}</span>.
             This cannot be undone.
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
