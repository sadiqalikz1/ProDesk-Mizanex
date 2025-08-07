
'use client';
import { useState, useEffect } from 'react';
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
import { Edit, History, Archive, ArrowDownUp } from 'lucide-react';

import { AddEntryDialog } from './add-entry-dialog';
import { EditEntryDialog } from './edit-entry-dialog';
import { UpdateFileDialog } from './update-file-dialog';
import { CloseFileDialog } from './close-file-dialog';
import { Entry } from './types';

export default function PhysicalFileTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
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
  
  const getLatestHistory = (entry: Entry) => {
      if (!entry.locationHistory || entry.locationHistory.length === 0) {
          return { lastMoved: 'N/A', notes: entry.description };
      }
      const latest = entry.locationHistory[entry.locationHistory.length - 1];
      return {
          lastMoved: new Date(latest.date).toLocaleDateString(),
          notes: latest.notes,
      }
  }

  return (
    <>
      <Card>
        <CardHeader>
            <div>
              <CardTitle>Physical File List</CardTitle>
              <CardDescription>
                A log of all physical documents and their locations.
              </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Rack</TableHead>
                  <TableHead>Box</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Moved</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const { lastMoved, notes } = getLatestHistory(entry);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.fileNo}</TableCell>
                      <TableCell>{entry.fileType}</TableCell>
                      <TableCell>{entry.company}</TableCell>
                      <TableCell>{entry.roomNo}</TableCell>
                      <TableCell>{entry.rackNo}</TableCell>
                      <TableCell>{entry.boxNo}</TableCell>
                      <TableCell>{entry.owner}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lastMoved}</TableCell>
                      <TableCell>{notes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdate(entry)}
                            title="Update/Move"
                          >
                            <ArrowDownUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCloseFile(entry)}
                            title="Close File"
                            disabled={entry.status === 'Closed'}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="View History (coming soon)" disabled>
                              <History className="h-4 w-4" />
                          </Button>
                        </div>
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
