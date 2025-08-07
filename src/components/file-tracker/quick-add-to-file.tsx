
'use client';

import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';
import { Combobox } from '@/components/ui/combobox';

export default function QuickAddToFile() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [docNumber, setDocNumber] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');

    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEntries: Entry[] = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setEntries(loadedEntries.filter(e => e.status !== 'Closed'));
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (selectedFileId) {
      const selectedEntry = entries.find((e) => e.id === selectedFileId);
      if (selectedEntry) {
        const history = selectedEntry.locationHistory || [];
        const docCount = history.filter(h => h.notes.startsWith('Added Doc:')).length;
        setDocPosition((docCount + 1).toString());
      }
    } else {
        setDocPosition('');
    }
  }, [selectedFileId, entries]);

  const handleFileSelect = (fileId: string) => {
      setSelectedFileId(fileId);
  }

  const handleAddToHistory = async () => {
    if (!selectedFileId) {
      toast({
        title: 'Missing File',
        description: 'Please select a file.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entry = entries.find((e) => e.id === selectedFileId);

    if (!entry) {
      toast({ title: 'Error', description: 'Selected file not found.', variant: 'destructive' });
      return;
    }

    if (docNumber) {
        const history = entry.locationHistory || [];
        const isDuplicate = history.some(h => 
            h.notes.startsWith('Added Doc:') && h.notes.includes(`#${docNumber} `)
        );

        if (isDuplicate) {
            toast({
                title: 'Duplicate Document Number',
                description: `Document number "${docNumber}" already exists in this file's history.`,
                variant: 'destructive',
            });
            return;
        }
    }

    const entryRef = ref(db, `entries/${selectedFileId}`);
    
    let constructedNotes = 'Added Doc: ';
    if (docNumber) constructedNotes += `#${docNumber} `;
    if (docPosition) constructedNotes += `(Pos: ${docPosition}) `;
    if (notes) constructedNotes += `- ${notes}`;

    if (!docNumber && !notes) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a document number or notes.',
        variant: 'destructive',
      });
      return;
    }

    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Shelf: ${entry.shelfNo}, Box: ${entry.boxNo}`,
      status: entry.status,
      updatedBy: 'System Quick Add',
      notes: constructedNotes,
    };

    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    await update(entryRef, { locationHistory: updatedHistory });

    toast({
      title: 'History Added',
      description: `Successfully added a new entry to the history of file ${entry.fileNo}.`,
    });

    // Keep file selected, but clear other fields
    setDocNumber('');
    setNotes('');
    
    // Position will be recalculated by useEffect, need to manually trigger update to entries state
    const updatedEntries = entries.map(e => e.id === selectedFileId ? {...e, locationHistory: updatedHistory} : e);
    setEntries(updatedEntries);
  };

  const fileOptions = entries.map((entry) => ({
    value: entry.id,
    label: `${entry.fileNo} - ${entry.company}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add to File History</CardTitle>
        <CardDescription>
          Quickly add a note or document to an existing file's history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="quick-file-select">Select a file...</Label>
            <Combobox
              options={fileOptions}
              value={selectedFileId}
              onChange={handleFileSelect}
              placeholder="Select a file..."
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="quick-doc-number">Doc Number</Label>
            <Input
              id="quick-doc-number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g., INV-123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-doc-position">Document Position</Label>
            <Input
              id="quick-doc-position"
              value={docPosition}
              readOnly
              className="bg-muted"
              placeholder="Auto-generated"
            />
          </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="quick-notes">Description/Notes</Label>
            <Input
              id="quick-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Paid in full"
            />
          </div>
        <div>
            <Button onClick={handleAddToHistory} className="w-full" disabled={!selectedFileId}>
              Add to History
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
