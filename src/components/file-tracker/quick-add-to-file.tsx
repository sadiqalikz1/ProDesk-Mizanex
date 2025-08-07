
'use client';

import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
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
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');
    const docTypesRef = ref(db, 'docTypes');

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

    get(docTypesRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDocTypes(Object.values(snapshot.val()));
      }
    });

    return () => unsubscribe();
  }, []);
  
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

    const entryRef = ref(db, `entries/${selectedFileId}`);
    
    let constructedNotes = 'Added Doc: ';
    if (docType) constructedNotes += `${docType} `;
    if (docNumber) constructedNotes += `#${docNumber} `;
    if (notes) constructedNotes += `- ${notes}`;

    if (constructedNotes === 'Added Doc: ') {
      toast({
        title: 'Missing Information',
        description: 'Please provide a document type, number, or notes.',
        variant: 'destructive',
      });
      return;
    }

    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Box: ${entry.boxNo}`,
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

    setSelectedFileId('');
    setDocType('');
    setDocNumber('');
    setNotes('');
  };

  const fileOptions = entries.map((entry) => ({
    value: entry.id,
    label: `${entry.fileNo} - ${entry.company}`,
  }));
  
  const docTypeOptions = docTypes.map((type) => ({
    value: type,
    label: type,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="quick-file-select">Find File by Reference #</Label>
            <Combobox
              options={fileOptions}
              value={selectedFileId}
              onChange={handleFileSelect}
              placeholder="Select a file..."
            />
          </div>
          <div className="space-y-2">
             <Label htmlFor="quick-doc-type">Document Type</Label>
            <Combobox
              options={docTypeOptions}
              value={docType}
              onChange={setDocType}
              placeholder="Select type..."
              createLabel="Create new type"
            />
          </div>
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
            <Label htmlFor="quick-notes">Description/Notes</Label>
            <Input
              id="quick-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Paid in full"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleAddToHistory} className="w-full">
              Add to History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
