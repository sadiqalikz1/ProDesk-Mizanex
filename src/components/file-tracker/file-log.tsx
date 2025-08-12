
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Entry, LocationHistory } from './types';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { EditHistoryEntryDialog } from './edit-history-entry-dialog';
import { DeleteHistoryEntryDialog } from './delete-history-entry-dialog';

type HistoryEntry = {
  parentFile: Entry;
  history: LocationHistory;
  historyIndex: number;
};

export default function FileLog() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');

    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      const allHistory: HistoryEntry[] = [];
      const allEntries: {[id: string]: Entry} = {};
      
      if (data) {
        Object.keys(data).forEach(key => {
            allEntries[key] = { id: key, ...data[key] };
        });

        Object.keys(allEntries).forEach((key) => {
          const entryData = allEntries[key];
          if (entryData.locationHistory && Array.isArray(entryData.locationHistory)) {
            entryData.locationHistory.forEach((hist: LocationHistory, index: number) => {
              allHistory.push({ parentFile: entryData, history: hist, historyIndex: index });
            });
          }
        });
      }
      // Sort by date descending
      allHistory.sort((a, b) => new Date(b.history.date).getTime() - new Date(a.history.date).getTime());
      setHistory(allHistory);
    });

    return () => unsubscribe();
  }, []);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;

    const lowercasedTerm = searchTerm.toLowerCase();
    return history.filter(({ parentFile, history }) => {
      return (
        parentFile.fileNo?.toLowerCase().includes(lowercasedTerm) ||
        parentFile.fileType?.toLowerCase().includes(lowercasedTerm) ||
        parentFile.company?.toLowerCase().includes(lowercasedTerm) ||
        history.location?.toLowerCase().includes(lowercasedTerm) ||
        history.status?.toLowerCase().includes(lowercasedTerm) ||
        history.updatedBy?.toLowerCase().includes(lowercasedTerm) ||
        history.notes?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, history]);

  const handleEdit = (item: HistoryEntry) => {
    setSelectedHistoryItem(item);
    setIsEditDialogOpen(true);
  }

  const handleDelete = (item: HistoryEntry) => {
    setSelectedHistoryItem(item);
    setIsDeleteDialogOpen(true);
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Storage': return 'default';
      case 'Checked Out': return 'secondary';
      case 'In Use': return 'destructive';
      case 'Closed':
      case 'Created':
      case 'Approved':
      case 'Sealed':
      case 'Signed':
        return 'outline';
      default: return 'default';
    }
  };
  
  const YesNoBadge = ({value}: {value: boolean | undefined}) => (
    <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
  )

  const getDocInfo = (notes: string) => {
    if (!notes) {
      return { docNumber: 'N/A', docPosition: 'N/A', remainingNotes: 'N/A' };
    }
    
    const docNumberMatch = notes.match(/#(\S+)/);
    const docPositionMatch = notes.match(/\(Pos: (\d+)\)/);
    
    const docNumber = docNumberMatch ? docNumberMatch[1] : 'N/A';
    const docPosition = docPositionMatch ? docPositionMatch[1] : 'N/A';
    
    // Remove the extracted parts to get remaining notes
    const remainingNotes = notes.replace(/Added Doc: #\S+ \s?/, '')
                                .replace(/\(Pos: \d+\)\s?/, '')
                                .replace(/^- /, '')
                                .trim();

    return { docNumber, docPosition, remainingNotes: remainingNotes || 'N/A' };
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>File History Log</CardTitle>
            <CardDescription>
              A detailed log of all activities for every file.
            </CardDescription>
          </div>
          <Input
            placeholder="Find in history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Doc Pos</TableHead>
                <TableHead>Doc #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Signed</TableHead>
                <TableHead>Sealed</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item, index) => {
                const { docPosition, docNumber, remainingNotes } = getDocInfo(item.history.notes);
                return (
                  <TableRow key={`${item.parentFile.id}-${item.historyIndex}`}>
                    <TableCell className="font-medium">{item.parentFile.fileNo}</TableCell>
                    <TableCell>{item.parentFile.fileType}</TableCell>
                    <TableCell>{item.parentFile.company}</TableCell>
                    <TableCell>{item.history.location}</TableCell>
                    <TableCell>{docPosition}</TableCell>
                    <TableCell>{docNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.history.status)}>
                        {item.history.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.history.updatedBy}</TableCell>
                    <TableCell>{new Date(item.history.date).toLocaleString()}</TableCell>
                    <TableCell><YesNoBadge value={item.history.isSigned} /></TableCell>
                    <TableCell><YesNoBadge value={item.history.isSealed} /></TableCell>
                    <TableCell>{remainingNotes}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    {selectedHistoryItem && (
        <EditHistoryEntryDialog 
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            entry={selectedHistoryItem.parentFile}
            historyEntry={selectedHistoryItem.history}
            historyIndex={selectedHistoryItem.historyIndex}
        />
    )}
    {selectedHistoryItem && (
        <DeleteHistoryEntryDialog 
            isOpen={isDeleteDialogOpen}
            setIsOpen={setIsDeleteDialogOpen}
            entry={selectedHistoryItem.parentFile}
            historyEntry={selectedHistoryItem.history}
            historyIndex={selectedHistoryItem.historyIndex}
        />
    )}
    </>
  );
}