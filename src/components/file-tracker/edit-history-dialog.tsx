
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
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

export function EditHistoryDialog({
  isOpen,
  setIsOpen,
  entry,
  historyItem,
  historyIndex,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
  historyItem: LocationHistory;
  historyIndex: number;
}) {
  const [docNumber, setDocNumber] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [remainingNotes, setRemainingNotes] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const { toast } = useToast();

  const getDocInfo = (notes: string) => {
    if (!notes) {
      return { docNumber: '', docPosition: '', remainingNotes: '' };
    }
    const docNumberMatch = notes.match(/#(\S+)/);
    const docPositionMatch = notes.match(/\(Pos: (\d+)\)/);
    const docNumber = docNumberMatch ? docNumberMatch[1] : '';
    const docPosition = docPositionMatch ? docPositionMatch[1] : '';
    const remainingNotes = notes.replace(/Added Doc: #\S+ \s?/, '').replace(/\(Pos: \d+\)\s?/, '').replace(/^- /, '').trim();
    return { docNumber, docPosition, remainingNotes: remainingNotes || '' };
  }

  useEffect(() => {
    if (historyItem) {
        const { docNumber, docPosition, remainingNotes } = getDocInfo(historyItem.notes || '');
        setDocNumber(docNumber);
        setDocPosition(docPosition);
        setRemainingNotes(remainingNotes);
        setIsSigned(historyItem.isSigned || false);
        setIsSealed(historyItem.isSealed || false);
    }
  }, [historyItem]);

  const handleSave = async () => {
    if (!entry || historyIndex < 0) return;

    // --- Validation Start ---
    if (docPosition) {
        const isDuplicatePosition = (entry.locationHistory || []).some((h, index) => {
            if (index === historyIndex) return false; // Skip the item being edited
            const { docPosition: existingPos } = getDocInfo(h.notes);
            return existingPos === docPosition;
        });

        if (isDuplicatePosition) {
            toast({
                title: "Duplicate Position",
                description: `Position "${docPosition}" already exists in this file. Please choose a different position.`,
                variant: "destructive",
            });
            return;
        }
    }
    // --- Validation End ---

    let constructedNotes = 'Added Doc: ';
    if (docNumber) constructedNotes += `#${docNumber} `;
    if (docPosition) constructedNotes += `(Pos: ${docPosition}) `;
    if (remainingNotes) constructedNotes += `- ${remainingNotes}`;
    
    if (!docNumber && !docPosition && !remainingNotes) {
      toast({
        title: "Cannot save",
        description: "Document details cannot be empty.",
        variant: "destructive"
      })
      return;
    }

    const db = getDatabase(app);
    const updatedHistory = [...(entry.locationHistory || [])];
    
    const itemToUpdate = { ...updatedHistory[historyIndex] };
    itemToUpdate.notes = constructedNotes;
    itemToUpdate.isSigned = isSigned;
    itemToUpdate.isSealed = isSealed;
    
    updatedHistory[historyIndex] = itemToUpdate;

    const entryRef = ref(db, `entries/${entry.id}`);
    await update(entryRef, {
      locationHistory: updatedHistory,
    });

    toast({
      title: 'History Updated',
      description: 'The history entry has been successfully updated.',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit History Entry</DialogTitle>
          <DialogDescription>
            Update the details for this history record in file: {entry.fileNo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document #</Label>
              <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label>Document Position</Label>
              <Input value={docPosition} onChange={e => setDocPosition(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={remainingNotes}
              onChange={(e) => setRemainingNotes(e.target.value)}
              placeholder="e.g., Paid in full"
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
