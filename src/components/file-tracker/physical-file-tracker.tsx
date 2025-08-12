
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, History, Archive, ArrowDownUp, MoreVertical, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { AddEntryDialog } from './add-entry-dialog';
import { EditEntryDialog } from './edit-entry-dialog';
import { UpdateFileDialog } from './update-file-dialog';
import { CloseFileDialog } from './close-file-dialog';
import { Entry } from './types';
import Link from 'next/link';

export default function PhysicalFileTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [isEditEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [isUpdateFileDialogOpen, setUpdateFileDialogOpen] = useState(false);
  const [isCloseFileDialogOpen, setCloseFileDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEntries: Entry[] = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            dateCreated: new Date(data[key].dateCreated),
            locationHistory: data[key].locationHistory || [],
          }))
        : [];
      setEntries(loadedEntries);
    });

    return () => unsubscribe();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;

    const lowercasedTerm = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      const location = `Room: ${entry.roomNo || 'N/A'}, Rack: ${entry.rackNo || 'N/A'}, Shelf: ${entry.shelfNo || 'N/A'}, Box: ${entry.boxNo || 'N/A'}`;
      return (
        entry.fileNo?.toLowerCase().includes(lowercasedTerm) ||
        entry.fileType?.toLowerCase().includes(lowercasedTerm) ||
        entry.company?.toLowerCase().includes(lowercasedTerm) ||
        entry.owner?.toLowerCase().includes(lowercasedTerm) ||
        entry.status?.toLowerCase().includes(lowercasedTerm) ||
        location.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, entries]);

  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setEditEntryDialogOpen(true);
  };

  const handleUpdate = (entry: Entry) => {
    setSelectedEntry(entry);
    setUpdateFileDialogOpen(true);
  };

  const handleCloseFile = (entry: Entry) => {
    setSelectedEntry(entry);
    setCloseFileDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Storage':
        return 'default';
      case 'Checked Out':
        return 'secondary';
      case 'In Use':
        return 'destructive';
      case 'Closed':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  const getLatestMoveDate = (entry: Entry) => {
    if (!entry.locationHistory || entry.locationHistory.length === 0) {
        return 'N/A';
    }
    const latest = entry.locationHistory[entry.locationHistory.length - 1];
    return new Date(latest.date).toLocaleDateString();
  }

  return (
    <>
    <Card>
      <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Physical File List</CardTitle>
                <CardDescription>
                  A log of all physical documents and their locations.
                </CardDescription>
              </div>
              <Input
                placeholder="Find in file list..."
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
                <TableHead>Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="w-[300px]">Location</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Moved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const location = `Room: ${entry.roomNo || 'N/A'}, Rack: ${entry.rackNo || 'N/A'}, Shelf: ${entry.shelfNo || 'N/A'}, Box: ${entry.boxNo || 'N/A'}`;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium whitespace-normal break-words">{entry.fileNo}</TableCell>
                    <TableCell>{entry.fileType}</TableCell>
                    <TableCell>{entry.company}</TableCell>
                    <TableCell>{location}</TableCell>
                    <TableCell>{entry.owner}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getLatestMoveDate(entry)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                             <Link href={`/file-page?id=${entry.id}`}>
                               <Eye className="mr-2 h-4 w-4" />
                               <span>View Details</span>
                             </Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleUpdate(entry)}>
                              <ArrowDownUp className="mr-2 h-4 w-4" />
                              <span>Update/Move</span>
                            </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(entry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCloseFile(entry)}
                            disabled={entry.status === 'Closed'}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            <span>Close File</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

      <AddEntryDialog
        isOpen={isAddEntryDialogOpen}
        setIsOpen={setAddEntryDialogOpen}
      />
      {selectedEntry && (
        <EditEntryDialog
          isOpen={isEditEntryDialogOpen}
          setIsOpen={setEditEntryDialogOpen}
          entry={selectedEntry}
        />
      )}
      {selectedEntry && (
        <UpdateFileDialog
          isOpen={isUpdateFileDialogOpen}
          setIsOpen={setUpdateFileDialogOpen}
          entry={selectedEntry}
        />
      )}
      {selectedEntry && (
        <CloseFileDialog
          isOpen={isCloseFileDialogOpen}
          setIsOpen={setCloseFileDialogOpen}
          entry={selectedEntry}
        />
      )}
    </>
  );
}
