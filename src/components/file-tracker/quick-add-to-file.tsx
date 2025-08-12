
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

type DuplicateError = {
  file: Entry;
  history: LocationHistory;
};

export default function QuickAddToFile() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedFile, setSelectedFile] = useState<Entry | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [isSigned, setIsSigned] = useState(true);
  const [isSealed, setIsSealed] = useState(true);
  const [isInitialed, setIsInitialed] = useState(true);
  const [duplicateError, setDuplicateError] = useState<DuplicateError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();
  const docNumberInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);


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
    if (selectedFile) {
      const history = selectedFile.locationHistory || [];
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
  }, [selectedFile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleFileSelect = (file: Entry) => {
      setSelectedFile(file);
      setSearchTerm(`${file.fileNo} - ${file.fileType} - ${file.company}`);
      setShowResults(false);
      setDuplicateError(null);
  }

  const handleDocNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocNumber(e.target.value);
    if (duplicateError) {
      setDuplicateError(null);
    }
  };

  const handleAddToHistory = async (event?: FormEvent) => {
    if (event) {
        event.preventDefault();
    }

    if (!selectedFile) {
      toast({
        title: 'Missing File',
        description: 'Please select a file.',
        variant: 'destructive',
      });
      return;
    }

    const entry = selectedFile;

    if (docNumber) {
        // Only check for duplicates within the same file type.
        const filesWithSameType = entries.filter(e => e.fileType === entry.fileType);
        let duplicateInfo: DuplicateError | null = null;

        for (const file of filesWithSameType) {
            const duplicateHistoryEntry = (file.locationHistory || []).find(h => 
                h.notes?.startsWith('Added Doc:') && h.notes.includes(`#${docNumber} `)
            );
            if (duplicateHistoryEntry) {
                duplicateInfo = { file: file, history: duplicateHistoryEntry };
                break;
            }
        }

        if (duplicateInfo) {
            setDuplicateError(duplicateInfo);
            toast({
                title: `Duplicate Document Number`,
                description: `Doc #${docNumber} already exists in file: ${duplicateInfo.file.fileNo}`,
                variant: 'destructive',
            })
            return;
        }
    }
    
    // Check for duplicate position *within the current file*
    const existingDocInCurrentFile = (entry.locationHistory || []).some(h =>
        h.notes?.includes(`(Pos: ${docPosition})`)
    );

    if (docPosition && existingDocInCurrentFile) {
        toast({
            title: 'Duplicate Position',
            description: `Position "${docPosition}" already exists in this file. Please choose a different position.`,
            variant: 'destructive',
        });
        return;
    }

    const entryRef = ref(getDatabase(app), `entries/${selectedFile.id}`);
    
    let constructedNotes = 'Added Doc: ';
    if (docNumber) constructedNotes += `#${docNumber} `;
    if (docPosition) constructedNotes += `(Pos: ${docPosition}) `;
    if (notes) constructedNotes += `- ${notes}`;

    if (!docNumber && !notes && !docPosition) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a document number, position, or notes.',
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
      isSigned,
      isSealed,
      isInitialed,
    };

    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    await update(entryRef, { locationHistory: updatedHistory });

    toast({
      title: 'History Added',
      description: `Successfully added a new entry to the history of file ${entry.fileNo}.`,
    });
    
    const updatedSelectedFile = { ...selectedFile, locationHistory: updatedHistory };
    setSelectedFile(updatedSelectedFile);
    
    setDocNumber('');
    setNotes('');
    setDuplicateError(null);
    docNumberInputRef.current?.focus();
  };

  const getDocInfoFromNotes = (notes: string) => {
    if (!notes) return { pos: 'N/A', remaining: 'N/A' };
    const posMatch = notes.match(/\(Pos: (\d+)\)/);
    const pos = posMatch ? posMatch[1] : 'N/A';
    const remaining = notes.replace(/Added Doc: #\S+ \s?/, '').replace(/\(Pos: \d+\)\s?/, '').replace(/^- /, '').trim();
    return { pos, remaining: remaining || 'N/A' };
  }

  const filteredEntries = entries.filter(entry => {
      const fullLabel = `${entry.fileNo} - ${entry.fileType} - ${entry.company}`;
      return fullLabel.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 10); // Limit results to 10 for performance

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
            <div className="space-y-2 relative" ref={searchContainerRef}>
                <Label htmlFor="quick-file-select">Search for a file...</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="quick-file-select"
                        placeholder="Start typing to search for a file..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowResults(true);
                            if (selectedFile && e.target.value === '') {
                                setSelectedFile(null);
                            }
                        }}
                        onFocus={() => setShowResults(true)}
                        className="pl-10"
                    />
                </div>
                {showResults && searchTerm && filteredEntries.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                        <CardContent className="p-2">
                            {filteredEntries.map(entry => (
                                <div 
                                    key={entry.id}
                                    onClick={() => handleFileSelect(entry)}
                                    className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                >
                                    {entry.fileNo} - {entry.fileType} - {entry.company}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
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
                onChange={handleDocNumberChange}
                placeholder="e.g., INV-123"
                className={cn(duplicateError && 'border-destructive focus-visible:ring-destructive')}
                />
                {duplicateError && (
                  <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md space-y-1">
                      <p className="font-semibold">Doc #{docNumber} already exists in a file of type "{duplicateError.file.fileType}".</p>
                      <p><span className="font-semibold">File:</span> {duplicateError.file.fileNo} ({duplicateError.file.company})</p>
                      <p><span className="font-semibold">Location:</span> {duplicateError.history.location}</p>
                      <p><span className="font-semibold">Position:</span> {getDocInfoFromNotes(duplicateError.history.notes).pos}</p>
                      <p><span className="font-semibold">Date Added:</span> {new Date(duplicateError.history.date).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Notes:</span> {getDocInfoFromNotes(duplicateError.history.notes).remaining}</p>
                  </div>
                )}
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
             <div className="flex items-center space-x-6 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="quick-sign" checked={isSigned} onCheckedChange={(checked) => setIsSigned(Boolean(checked))} />
                    <Label htmlFor="quick-sign" className="font-medium">Sign</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="quick-seal" checked={isSealed} onCheckedChange={(checked) => setIsSealed(Boolean(checked))} />
                    <Label htmlFor="quick-seal" className="font-medium">Seal</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="quick-initial" checked={isInitialed} onCheckedChange={(checked) => setIsInitialed(Boolean(checked))} />
                    <Label htmlFor="quick-initial" className="font-medium">Initial</Label>
                </div>
            </div>
            <div>
                <Button type="submit" className="w-full" disabled={!selectedFile || !!duplicateError}>
                    Add to History
                </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
