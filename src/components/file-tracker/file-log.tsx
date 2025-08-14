
'use client';

import { useState, useMemo } from 'react';
import { getDatabase, ref, update } from 'firebase/database';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { EditHistoryDialog } from './edit-history-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFileTracker } from '@/context/file-tracker-context';

type HistoryEntry = {
  parentFile: Entry;
  history: LocationHistory;
  originalIndex: number;
};

export default function FileLog() {
  const { entries } = useFileTracker();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryEntry | null>(null);

  useMemo(() => {
    const allHistory: HistoryEntry[] = [];
    entries.forEach((entry) => {
        if (entry.locationHistory && Array.isArray(entry.locationHistory)) {
          entry.locationHistory.forEach((hist, index) => {
            allHistory.push({ parentFile: entry, history: hist, originalIndex: index });
          });
        }
    });
    
    allHistory.sort((a, b) => new Date(b.history.date).getTime() - new Date(a.history.date).getTime());
    setHistory(allHistory);
  }, [entries]);
  

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

  const handleEditHistory = (item: HistoryEntry) => {
    setSelectedHistoryItem(item);
    setEditDialogOpen(true);
  };
  
  const handleDeleteHistory = (item: HistoryEntry) => {
    setSelectedHistoryItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHistory = async () => {
    if (!selectedHistoryItem) return;

    const { parentFile, originalIndex } = selectedHistoryItem;
    const db = getDatabase(app);
    const updatedHistory = [...(parentFile.locationHistory || [])];
    updatedHistory.splice(originalIndex, 1);

    const entryRef = ref(db, `entries/${parentFile.id}`);
    await update(entryRef, { locationHistory: updatedHistory });

    toast({
        title: 'History Entry Deleted',
        description: 'The history entry has been removed.',
        variant: 'destructive',
    });
    setDeleteDialogOpen(false);
    setSelectedHistoryItem(null);
  };

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
        <div className="h-[70vh] w-full overflow-auto">
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
                  <TableRow key={`${item.parentFile.id}-${index}`}>
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
                        {item.history.notes?.startsWith('Added Doc:') && item.parentFile.status !== 'Closed' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditHistory(item)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteHistory(item)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
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
        <EditHistoryDialog 
            isOpen={isEditDialogOpen}
            setIsOpen={setEditDialogOpen}
            entry={selectedHistoryItem.parentFile}
            historyItem={selectedHistoryItem.history}
            historyIndex={selectedHistoryItem.originalIndex}
        />
    )}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this history entry. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteHistory}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
