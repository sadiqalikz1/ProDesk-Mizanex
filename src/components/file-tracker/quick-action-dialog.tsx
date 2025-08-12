
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, update } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';

export function QuickActionDialog({
  isOpen,
  setIsOpen,
  entry,
  actionType,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
  actionType: 'Approve' | 'Seal' | 'Sign';
}) {
  const [updatedBy, setUpdatedBy] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setUpdatedBy('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!updatedBy) {
      toast({
        title: 'Missing Field',
        description: 'Please provide your name.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Shelf: ${entry.shelfNo}, Box: ${entry.boxNo}`,
      status: actionType + 'd', // e.g., Approved, Sealed, Signed
      updatedBy: updatedBy,
      notes: notes || `${actionType}d by ${updatedBy}`,
    };
    
    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    
    await update(entryRef, {
      locationHistory: updatedHistory,
    });
    
    toast({
      title: 'File Updated',
      description: `File ${entry.fileNo} has been marked as ${actionType}d.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionType} File: {entry.fileNo}</DialogTitle>
          <DialogDescription>
            Confirm that you are performing the action '{actionType}'.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="updatedBy-quick">Your Name</Label>
            <Input
              id="updatedBy-quick"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes-quick">Notes (Optional)</Label>
            <Textarea
              id="notes-quick"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., All documents verified."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Confirm {actionType}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
