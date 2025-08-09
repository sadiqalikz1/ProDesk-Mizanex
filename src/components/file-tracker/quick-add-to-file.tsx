
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
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
import { Badge } from '@/components/ui/badge';

export default function QuickAddToFile() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<Entry | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const docNumberInputRef = useRef<HTMLInputElement>(null);


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
    const file = entries.find((e) => e.id === selectedFileId) || null;
    setSelectedFile(file);

    if (file) {
      const history = file.locationHistory || [];
      const existingPositions = history
        .map(h => {
          const match = h.notes?.match(/\(Pos: (\d+)\)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((p): p is number => p !== null && !isNaN(p))
        .sort((a, b) => a - b);

      let nextPosition = 1;
      for (const pos of existingPositions) {
        if (pos === nextPosition) {
          nextPosition++;
        } else {
          break;
        }
      }
      setDocPosition(nextPosition.toString());
    } else {
      setDocPosition('');
    }
  }, [selectedFileId, entries]);


  const handleFileSelect = (fileId: string) => {
      setSelectedFileId(fileId);
  }

  const handleAddToHistory = async (event?: FormEvent) => {
    if (event) {
        event.preventDefault();
    }

    if (!selectedFileId) {
      toast({
        title: 'Missing File',
        description: 'Please select a file.',
        variant: 'destructive',
      });
      return;
    }

    const entry = entries.find((e) => e.id === selectedFileId);

    if (!entry) {
      toast({ title: 'Error', description: 'Selected file not found.', variant: 'destructive' });
      return;
    }

    if (docNumber) {
        const history = entry.locationHistory || [];
        const isDuplicate = history.some(h => 
            h.notes?.startsWith('Added Doc:') && h.notes.includes(`#${docNumber} `)
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

    const entryRef = ref(getDatabase(app), `entries/${selectedFileId}`);
    
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
    docNumberInputRef.current?.focus();
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
        <form onSubmit={handleAddToHistory} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="quick-file-select">Select a file...</Label>
                <Combobox
                options={fileOptions}
                value={selectedFileId}
                onChange={handleFileSelect}
                placeholder="Select a file..."
                />
            </div>
            {selectedFile && (
              <Card className="p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center">
                        <Label className="w-24 font-semibold">File Type</Label>
                        <span className="text-muted-foreground">{selectedFile.fileType}</span>
                    </div>
                    <div className="flex items-center">
                        <Label className="w-24 font-semibold">Company</Label>
                        <span className="text-muted-foreground">{selectedFile.company}</span>
                    </div>
                    <div className="flex items-center">
                        <Label className="w-24 font-semibold">Owner</Label>
                        <span className="text-muted-foreground">{selectedFile.owner}</span>
                    </div>
                    <div className="flex items-center">
                        <Label className="w-24 font-semibold">Status</Label>
                        <Badge variant={selectedFile.status === "In Use" ? "destructive" : "default"}>
                            {selectedFile.status}
                        </Badge>
                    </div>
                    <div className="flex items-center col-span-2">
                        <Label className="w-24 font-semibold">Location</Label>
                        <span className="text-muted-foreground">{`Room: ${selectedFile.roomNo}, Rack: ${selectedFile.rackNo}, Shelf: ${selectedFile.shelfNo}, Box: ${selectedFile.boxNo}`}</span>
                    </div>
                </div>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="quick-doc-number">Doc Number</Label>
                <Input
                id="quick-doc-number"
                ref={docNumberInputRef}
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
                onChange={(e) => setDocPosition(e.target.value)}
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
                <Button type="submit" className="w-full" disabled={!selectedFileId}>
                    Add to History
                </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
