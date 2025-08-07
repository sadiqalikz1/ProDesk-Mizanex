
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

type HistoryEntry = {
  parentFile: Omit<Entry, 'locationHistory'>;
  history: LocationHistory;
};

export default function FileHistoryTracker() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');

    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      const allHistory: HistoryEntry[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          const entryData = data[key];
          const parentFile = {
            id: key,
            fileNo: entryData.fileNo,
            fileType: entryData.fileType,
            company: entryData.company,
            dateCreated: new Date(entryData.dateCreated),
            description: entryData.description,
            owner: entryData.owner,
            roomNo: entryData.roomNo,
            rackNo: entryData.rackNo,
            boxNo: entryData.boxNo,
            status: entryData.status,
          };
          if (entryData.locationHistory && Array.isArray(entryData.locationHistory)) {
            entryData.locationHistory.forEach((hist: LocationHistory) => {
              allHistory.push({ parentFile, history: hist });
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
        parentFile.company?.toLowerCase().includes(lowercasedTerm) ||
        parentFile.fileType?.toLowerCase().includes(lowercasedTerm) ||
        history.location?.toLowerCase().includes(lowercasedTerm) ||
        history.status?.toLowerCase().includes(lowercasedTerm) ||
        history.updatedBy?.toLowerCase().includes(lowercasedTerm) ||
        history.notes?.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [searchTerm, history]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Storage': return 'default';
      case 'Checked Out': return 'secondary';
      case 'In Use': return 'destructive';
      case 'Closed':
      case 'Created':
        return 'outline';
      default: return 'default';
    }
  };

  return (
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
        <div className="w-full h-[70vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Ref #</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="min-w-[250px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item, index) => (
                <TableRow key={`${item.parentFile.id}-${index}`}>
                  <TableCell className="font-medium">{item.parentFile.fileNo}</TableCell>
                  <TableCell>{item.parentFile.company}</TableCell>
                  <TableCell>{item.history.location}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.history.status)}>
                      {item.history.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.history.updatedBy}</TableCell>
                  <TableCell>{new Date(item.history.date).toLocaleString()}</TableCell>
                  <TableCell>{item.history.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
