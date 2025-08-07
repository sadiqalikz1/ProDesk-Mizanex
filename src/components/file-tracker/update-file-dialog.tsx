
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';

export function UpdateFileDialog({
  isOpen,
  setIsOpen,
  entry,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
}) {
  const [status, setStatus] = useState(entry.status);
  const [updatedBy, setUpdatedBy] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStatus(entry.status);
      setUpdatedBy('');
      setNotes('');
    }
  }, [isOpen, entry]);

  const handleSave = async () => {
    if (!updatedBy || !notes) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide who is updating and some notes.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Box: ${entry.boxNo}`,
      status: status,
      updatedBy: updatedBy,
      notes: notes,
    };
    
    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    
    await update(entryRef, {
      status: status,
      locationHistory: updatedHistory,
    });
    
    toast({
      title: 'File Updated',
      description: `Status for ${entry.fileNo} has been updated.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update/Move File: {entry.fileNo}</DialogTitle>
          <DialogDescription>
            Update the status and log any changes for this file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Storage">Check In (In Storage)</SelectItem>
                <SelectItem value="Checked Out">Check Out</SelectItem>
                <SelectItem value="In Use">In Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="updatedBy">Your Name</Label>
            <Input
              id="updatedBy"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Reason</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Added new invoice #12345"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
