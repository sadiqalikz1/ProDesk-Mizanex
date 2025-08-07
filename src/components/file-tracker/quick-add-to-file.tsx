
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
  const [notes, setNotes] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
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
  
  const handleFileSelect = (fileId: string) => {
      setSelectedFileId(fileId);
      setNotes('Added new document: ');
  }

  const handleAddToHistory = async () => {
    if (!selectedFileId || !notes || !updatedBy) {
      toast({
        title: 'Missing Fields',
        description: 'Please select a file, enter notes, and your name.',
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

    const entryRef = ref(db, `entries/${selectedFileId}`);
    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Box: ${entry.boxNo}`,
      status: entry.status,
      updatedBy,
      notes,
    };

    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    await update(entryRef, { locationHistory: updatedHistory });

    toast({
      title: 'History Added',
      description: `Successfully added a new entry to the history of file ${entry.fileNo}.`,
    });

    setSelectedFileId('');
    setNotes('');
    setUpdatedBy('');
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
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 space-y-2">
            <Label htmlFor="quick-file-select">Find File by Reference #</Label>
            <Combobox
              options={fileOptions}
              value={selectedFileId}
              onChange={handleFileSelect}
              placeholder="Select a file..."
            />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label htmlFor="quick-updated-by">Your Name</Label>
            <Input
              id="quick-updated-by"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="md:col-span-1 space-y-2">
            <Label htmlFor="quick-notes">Description/Notes</Label>
            <Input
              id="quick-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Added Invoice #12345"
            />
          </div>
          <div className="md:col-span-1">
            <Button onClick={handleAddToHistory} className="w-full">
              Add to History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
