
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
import { Badge } from '@/components/ui/badge';
<<<<<<< HEAD
import { Building, Library, Archive, FileText, XCircle } from 'lucide-react';
import { Entry, Shelf } from './types';
=======
import { Building, Library, Settings } from 'lucide-react';
import { Entry, Shelf } from './types';
import { cn } from '@/lib/utils';
import { EditShelfDialog } from './edit-shelf-dialog';
import { Button } from '../ui/button';
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

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
          shelves.push({ id: childSnapshot.key!, ...childSnapshot.val() });
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

  const handleEditShelf = (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setIsEditDialogOpen(true);
  }

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
    <>
     <Card>
      <CardHeader>
        <CardTitle>Shelf Visualization</CardTitle>
        <CardDescription>
          A virtual layout of your physical shelves, showing occupied and empty slots.
        </CardDescription>
      </CardHeader>
<<<<<<< HEAD
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
=======
      <CardContent className="space-y-8">
        {sortedRooms.map((room) => (
          <div key={room}>
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Room: {room}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {Object.keys(data[room]).sort().map((rack) => (
                <div key={rack} className="border-4 border-muted-foreground p-4 bg-muted/20 rounded-lg">
                   <div className="flex items-center gap-3 mb-4">
                      <Library className="h-6 w-6 text-primary" />
                      <h3 className="text-lg font-semibold">Rack: {rack}</h3>
                    </div>
                  <div className="space-y-4">
                    {data[room][rack].map(({ shelf, files }) => (
                        <div key={shelf.id} className="w-full bg-muted/40 p-2 border-y-8 border-muted-foreground rounded-md">
                          <div className='flex justify-between items-center mb-2 px-1'>
                            <p className='font-semibold text-sm'>Shelf: {shelf.shelfNo}</p>
                            <Button variant="ghost" size="icon" className='h-6 w-6' onClick={() => handleEditShelf(shelf)}>
                              <Settings className='h-4 w-4' />
                            </Button>
                          </div>
                          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                              {Array.from({ length: shelf.capacity }, (_, i) => {
                                  const position = i + 1;
                                  const file = files.find(f => parseInt(f.boxNo, 10) === position);

                                  return (
                                    <div key={position} className={cn(
                                      'relative flex flex-col shrink-0 items-center justify-end p-1 rounded-sm h-32 w-full text-center text-xs border-2 shadow-inner',
                                      file ? 'border-primary/80 bg-background' : 'border-dashed border-muted-foreground/50 bg-muted/30'
                                    )}>
                                      <div className="absolute top-1 right-1 font-bold text-muted-foreground/50 text-[10px]">{position}</div>
                                      <div className={cn(
                                        'absolute top-4 h-5 w-1/3 border-2 rounded-t-sm border-b-0',
                                        file ? 'border-primary/50' : 'border-muted-foreground/30'
                                      )}></div>
                                      
                                      {file ? (
                                          <div className="flex flex-col justify-end items-center h-full w-full pt-8">
                                              <p className="font-bold break-all leading-tight text-[11px] mb-1">{file.fileNo}</p>
                                              <Badge variant={getStatusVariant(file.status)} className="text-[9px] h-4 px-1.5">{file.status}</Badge>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col justify-center items-center h-full w-full">
                                              <span className='text-muted-foreground/40 text-[10px]'>Empty</span>
                                          </div>
                                      )}
                                    </div>
                                  )
                              })}
                          </div>
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
                        </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
     </Card>
      {selectedShelf && (
          <EditShelfDialog
              isOpen={isEditDialogOpen}
              setIsOpen={setIsEditDialogOpen}
              shelf={selectedShelf}
          />
      )}
    </>
  );
}
