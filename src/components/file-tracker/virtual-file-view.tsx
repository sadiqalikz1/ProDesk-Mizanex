
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Box, Archive, Folder, File, Building, Library } from 'lucide-react';
import { Entry } from './types';

type LocationData = {
  [room: string]: {
    [rack: string]: {
      [shelf: string]: {
        [box: string]: Entry[];
      };
    };
  };
};

export default function VirtualFileView() {
  const [data, setData] = useState<LocationData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');

    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const entries = snapshot.val();
      const groupedData: LocationData = {};
      if (entries) {
        Object.keys(entries).forEach((key) => {
          const entry = { id: key, ...entries[key] };
          const {
            roomNo = 'Unassigned',
            rackNo = 'Unassigned',
            shelfNo = 'Unassigned',
            boxNo = 'Unassigned',
          } = entry;

          if (!groupedData[roomNo]) groupedData[roomNo] = {};
          if (!groupedData[roomNo][rackNo]) groupedData[roomNo][rackNo] = {};
          if (!groupedData[roomNo][rackNo][shelfNo])
            groupedData[roomNo][rackNo][shelfNo] = {};
          if (!groupedData[roomNo][rackNo][shelfNo][boxNo])
            groupedData[roomNo][rackNo][shelfNo][boxNo] = [];

          groupedData[roomNo][rackNo][shelfNo][boxNo].push(entry);
        });
      }
      setData(groupedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Virtual View...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we organize your files...</p>
        </CardContent>
      </Card>
    );
  }

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

  const sortedRooms = Object.keys(data).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Visualization</CardTitle>
        <CardDescription>
          A virtual layout of your physical file storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {sortedRooms.map((room) => (
            <AccordionItem value={`room-${room}`} key={room} className="border rounded-md px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Room: {room}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-8">
                <Accordion type="multiple" className="w-full space-y-2">
                  {Object.keys(data[room]).sort().map((rack) => (
                    <AccordionItem value={`rack-${rack}`} key={rack} className="border rounded-md px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Library className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Rack: {rack}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8">
                        <Accordion type="multiple" className="w-full space-y-2">
                          {Object.keys(data[room][rack]).sort((a,b) => Number(a) - Number(b)).map((shelf) => (
                              <AccordionItem value={`shelf-${shelf}`} key={shelf} className="border rounded-md px-4">
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-3">
                                    <Archive className="h-5 w-5 text-primary" />
                                    <span className="font-semibold">
                                      Shelf: {shelf}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-8 pt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.keys(data[room][rack][shelf]).sort((a,b) => Number(a) - Number(b)).map((box) => (
                                        <Card key={box}>
                                          <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                                            <CardTitle className="text-base flex items-center gap-2">
                                              <Box className="h-5 w-5" />
                                              Box/Folder: {box}
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="p-4 space-y-3">
                                            {data[room][rack][shelf][box].map((file) => (
                                                <div key={file.id} className="text-sm p-2 rounded-md border bg-background">
                                                  <p className="font-bold flex items-center gap-2">
                                                    <File className="h-4 w-4 text-muted-foreground" />
                                                    {file.fileNo}
                                                  </p>
                                                  <p className="text-muted-foreground pl-6">{file.fileType}</p>
                                                  <div className="pl-6 mt-1">
                                                    <Badge variant={getStatusVariant(file.status)}>{file.status}</Badge>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </CardContent>
                                        </Card>
                                      )
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          )}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
