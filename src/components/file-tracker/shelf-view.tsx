
'use client';

import { useState, useEffect } from 'react';
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
import { Building, Library, Archive, FileText, XCircle } from 'lucide-react';
import { Entry, Shelf } from './types';

type OrganizedData = {
  [room: string]: {
    [rack: string]: {
      shelf: Shelf;
      files: Entry[];
    }[];
  };
};

export default function ShelfView() {
  const [data, setData] = useState<OrganizedData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');
    const shelvesRef = ref(db, 'shelves');

    const unsubscribeEntries = onValue(entriesRef, (snapshot) => {
      const entries: Entry[] = [];
      snapshot.forEach((childSnapshot) => {
        entries.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      const unsubscribeShelves = onValue(shelvesRef, (shelfSnapshot) => {
        const shelves: Shelf[] = [];
        shelfSnapshot.forEach((childSnapshot) => {
          shelves.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        const organizedData: OrganizedData = {};
        shelves.forEach((shelf) => {
          const { roomNo, rackNo, shelfNo } = shelf;
          if (!organizedData[roomNo]) organizedData[roomNo] = {};
          if (!organizedData[roomNo][rackNo]) organizedData[roomNo][rackNo] = [];

          const filesOnShelf = entries.filter(
            (e) =>
              e.roomNo === roomNo && e.rackNo === rackNo && e.shelfNo === shelfNo
          );
          
          organizedData[roomNo][rackNo].push({ shelf, files: filesOnShelf });
        });
        
        // Sort shelves numerically
        for(const room in organizedData) {
            for (const rack in organizedData[room]) {
                organizedData[room][rack].sort((a, b) => parseInt(a.shelf.shelfNo) - parseInt(b.shelf.shelfNo));
            }
        }

        setData(organizedData);
        setLoading(false);
      });
      return () => unsubscribeShelves();
    });

    return () => unsubscribeEntries();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Shelf View...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we organize your shelves...</p>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Storage': return 'default';
      case 'Checked Out': return 'secondary';
      case 'In Use': return 'destructive';
      case 'Closed': return 'outline';
      default: return 'default';
    }
  };

  const sortedRooms = Object.keys(data).sort();
  
  return (
     <Card>
      <CardHeader>
        <CardTitle>Shelf Visualization</CardTitle>
        <CardDescription>
          A virtual layout of your physical shelves, showing occupied and empty slots.
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
              <AccordionContent className="pl-8 pt-4">
                <Accordion type="multiple" className="w-full space-y-2">
                  {Object.keys(data[room]).sort().map((rack) => (
                    <AccordionItem value={`rack-${rack}`} key={rack} className="border rounded-md px-4">
                       <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Library className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Rack: {rack}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 pt-4">
                        <div className="space-y-6">
                            {data[room][rack].map(({ shelf, files }) => (
                                <div key={shelf.id}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Archive className="h-5 w-5 text-primary" />
                                        <h4 className="font-semibold">Shelf: {shelf.shelfNo} (Capacity: {shelf.capacity})</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 border p-2 rounded-lg bg-muted/20">
                                        {Array.from({ length: shelf.capacity }, (_, i) => {
                                            const position = i + 1;
                                            const file = files.find(f => parseInt(f.boxNo, 10) === position);

                                            return (
                                                <div key={position} className={`relative flex flex-col items-center justify-center p-2 rounded-md h-28 text-center text-xs border-2 ${file ? 'border-primary/50 bg-background' : 'border-dashed border-muted-foreground/50 bg-muted/50'}`}>
                                                    <div className="absolute top-1 right-1 font-bold text-muted-foreground/50">{position}</div>
                                                    {file ? (
                                                        <>
                                                            <FileText className="h-6 w-6 mb-1 text-primary"/>
                                                            <p className="font-bold break-all">{file.fileNo}</p>
                                                            <p className="text-muted-foreground break-all">{file.fileType}</p>
                                                             <Badge variant={getStatusVariant(file.status)} className="mt-1">{file.status}</Badge>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-6 w-6 mb-1 text-muted-foreground/50"/>
                                                            <p className="text-muted-foreground font-medium">Empty</p>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
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
