
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { getDatabase, ref, update } from 'firebase/database';
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
import { useFileTracker } from '@/context/file-tracker-context';

type DuplicateError = {
  file: Entry;
  history: LocationHistory;
};

export default function QuickAddToFile() {
  const { entries, loading } = useFileTracker();
  const [activeEntries, setActiveEntries] = useState<Entry[]>([]);
  const [selectedFile, setSelectedFile] = useState<Entry | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [docPosition, setDocPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [isSigned, setIsSigned] = useState(true);
  const [isSealed, setIsSealed] = useState(true);
  const [duplicateError, setDuplicateError] = useState<DuplicateError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { toast } = useToast();
  const docNumberInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setActiveEntries(entries.filter(e => e.status !== 'Closed'));
  }, [entries]);
  
  const calculateNextPosition = (file: Entry | null) => {
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
  }

  useEffect(() => {
    calculateNextPosition(selectedFile);
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
  
  const getFullDocNumber = (num: string) => {
    const parts = [];
    if (prefix) parts.push(prefix);
    if (num) parts.push(num);
    if (suffix) parts.push(suffix);
    return parts.join('');
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
    const fullDocNumber = getFullDocNumber(docNumber);

    if (fullDocNumber) {
        const filesWithSameType = entries.filter(e => e.fileType === entry.fileType);
        let duplicateInfo: DuplicateError | null = null;

        for (const file of filesWithSameType) {
            const duplicateHistoryEntry = (file.locationHistory || []).find(h => {
                if (!h.notes?.startsWith('Added Doc:')) return false;
                const docIdMatch = h.notes.match(/#(\S+)/);
                const existingDocId = docIdMatch ? docIdMatch[1] : null;
                return existingDocId === fullDocNumber;
            });

            if (duplicateHistoryEntry) {
                duplicateInfo = { file: file, history: duplicateHistoryEntry };
                break;
            }
        }

        if (duplicateInfo) {
            setDuplicateError(duplicateInfo);
            toast({
                title: `Duplicate Document Number`,
                description: `Doc #${fullDocNumber} already exists in file: ${duplicateInfo.file.fileNo}`,
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

    let constructedNotes = 'Added Doc: ';
    if (fullDocNumber) constructedNotes += `#${fullDocNumber} `;
    if (docPosition) constructedNotes += `(Pos: ${docPosition}) `;
    if (notes) constructedNotes += `- ${notes}`;

    // Check if at least one field is provided
    if (!fullDocNumber.trim() && !docPosition.trim() && !notes.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a document number, position, or notes.',
        variant: 'destructive',
      });
      return;
    }

    const entryRef = ref(getDatabase(app), `entries/${selectedFile.id}`);

    const newHistoryEntry: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${entry.roomNo}, Rack: ${entry.rackNo}, Shelf: ${entry.shelfNo}, Box: ${entry.boxNo}`,
      status: entry.status,
      updatedBy: 'System Quick Add',
      notes: constructedNotes,
      isSigned,
      isSealed,
    };

    const updatedHistory = [...(entry.locationHistory || []), newHistoryEntry];
    await update(entryRef, { locationHistory: updatedHistory });

    toast({
      title: 'History Added',
      description: `Successfully added a new entry to the history of file ${entry.fileNo}.`,
    });
    
    setDocNumber('');
    setNotes('');
    setDuplicateError(null);
    setIsSigned(true);
    setIsSealed(true);
    docNumberInputRef.current?.focus();
    
    const updatedFile = {...selectedFile, locationHistory: updatedHistory };
    setSelectedFile(updatedFile);
    calculateNextPosition(updatedFile);
  };

  const getDocInfoFromNotes = (notes: string) => {
    if (!notes) return { pos: 'N/A', remaining: 'N/A' };
    const posMatch = notes.match(/\(Pos: (\d+)\)/);
    const pos = posMatch ? posMatch[1] : 'N/A';
    const remaining = notes.replace(/Added Doc: #\S+ \s?/, '').replace(/\(Pos: \d+\)\s?/, '').replace(/^- /, '').trim();
    return { pos, remaining: remaining || 'N/A' };
  }

  const filteredEntries = activeEntries.filter(entry => {
      const fullLabel = `${entry.fileNo} - ${entry.fileType} - ${entry.company}`;
      return fullLabel.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 10);

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
                        autoComplete="off"
                        disabled={loading}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="quick-doc-prefix">Prefix</Label>
                  <Input
                    id="quick-doc-prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g., QFC"
                    autoComplete="off"
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="quick-doc-number">Doc Number</Label>
                  <Input
                  id="quick-doc-number"
                  ref={docNumberInputRef}
                  value={docNumber}
                  onChange={handleDocNumberChange}
                  placeholder="e.g., 12345"
                  className={cn(duplicateError && 'border-destructive focus-visible:ring-destructive')}
                  autoComplete="off"
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="quick-doc-suffix">Suffix</Label>
                  <Input
                    id="quick-doc-suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g., A"
                    autoComplete="off"
                  />
              </div>
            </div>

            {duplicateError && (
              <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md space-y-1">
                  <p className="font-semibold">Doc #{getFullDocNumber(docNumber)} already exists in a file of type "{duplicateError.file.fileType}".</p>
                  <p><span className="font-semibold">File:</span> {duplicateError.file.fileNo} ({duplicateError.file.company})</p>
                  <p><span className="font-semibold">Location:</span> {duplicateError.history.location}</p>
                  <p><span className="font-semibold">Position:</span> {getDocInfoFromNotes(duplicateError.history.notes).pos}</p>
                  <p><span className="font-semibold">Date Added:</span> {new Date(duplicateError.history.date).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Notes:</span> {getDocInfoFromNotes(duplicateError.history.notes).remaining}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-6 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="quick-sign" checked={isSigned} onCheckedChange={(checked) => setIsSigned(Boolean(checked))} />
                    <Label htmlFor="quick-sign" className="font-medium">Sign</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="quick-seal" checked={isSealed} onCheckedChange={(checked) => setIsSealed(Boolean(checked))} />
                    <Label htmlFor="quick-seal" className="font-medium">Seal</Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="quick-doc-position">Document Position</Label>
                  <Input
                  id="quick-doc-position"
                  value={docPosition}
                  onChange={(e) => setDocPosition(e.target.value)}
                  placeholder="Auto-generated"
                  autoComplete="off"
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="quick-notes">Description/Notes</Label>
                  <Input
                  id="quick-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Paid in full"
                  autoComplete="off"
                  />
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
