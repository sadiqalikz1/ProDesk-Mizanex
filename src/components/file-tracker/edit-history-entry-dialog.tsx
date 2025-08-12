
'use client'

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
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';

type EditHistoryEntryDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
  historyEntry: LocationHistory;
  historyIndex: number;
};

export function EditHistoryEntryDialog({
  isOpen,
  setIsOpen,
  entry,
  historyEntry,
  historyIndex,
}: EditHistoryEntryDialogProps) {
  const [docNumber, setDocNumber] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [isSigned, setIsSigned] = useState(historyEntry.isSigned || false);
  const [isSealed, setIsSealed] = useState(historyEntry.isSealed || false);

  const { toast } = useToast();

  useEffect(() => {
    if (historyEntry) {
      const docNumberMatch = historyEntry.notes?.match(/#(\S+)/);
      const docPositionMatch = historyEntry.notes?.match(/\(Pos: (\d+)\)/);
      const remainingNotes = historyEntry.notes
        ?.replace(/Added Doc: #\S+ \s?/, '')
        .replace(/\(Pos: \d+\)\s?/, '')
        .replace(/^- /, '')
        .trim();

      setDocNumber(docNumberMatch ? docNumberMatch[1] : '');
      setDocPosition(docPositionMatch ? docPositionMatch[1] : '');
      setNotes(remainingNotes || '');
      setIsSigned(historyEntry.isSigned || false);
      setIsSealed(historyEntry.isSealed || false);
    }
  }, [historyEntry]);

  const handleSave = async () => {
    const db = getDatabase(app);
    const historyRef = ref(db, `entries/${entry.id}/locationHistory/${historyIndex}`);
    
    let constructedNotes = 'Added Doc: ';
    if (docNumber) constructedNotes += `#${docNumber} `;
    if (docPosition) constructedNotes += `(Pos: ${docPosition}) `;
    if (notes) constructedNotes += `- ${notes}`;

    const updatedHistoryEntry: LocationHistory = {
      ...historyEntry,
      notes: constructedNotes,
      isSigned,
      isSealed,
    };

    try {
      await update(historyRef, updatedHistoryEntry);
      toast({
        title: 'History Entry Updated',
        description: 'The record has been successfully saved.',
      });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while saving the changes.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit History Entry</DialogTitle>
          <DialogDescription>
            Make changes to this historical record for file: {entry.fileNo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-doc-number">Document #</Label>
            <Input
              id="edit-doc-number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-doc-position">Document Position</Label>
            <Input
              id="edit-doc-position"
              value={docPosition}
              onChange={(e) => setDocPosition(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
                <Checkbox id="edit-sign" checked={isSigned} onCheckedChange={(checked) => setIsSigned(Boolean(checked))} />
                <Label htmlFor="edit-sign" className="font-medium">Signed</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="edit-seal" checked={isSealed} onCheckedChange={(checked) => setIsSealed(Boolean(checked))} />
                <Label htmlFor="edit-seal" className="font-medium">Sealed</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
