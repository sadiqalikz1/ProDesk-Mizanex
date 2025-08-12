
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
import { Shelf, Rack } from './types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Building, Library } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type OrganizedData = {
  [room: string]: Rack[];
};

export default function StorageDiagram() {
  const [data, setData] = useState<OrganizedData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase(app);
    const racksRef = ref(db, 'racksMetadata');
    const shelvesRef = ref(db, 'shelvesMetadata');

    const unsubscribeRacks = onValue(racksRef, (racksSnapshot) => {
      const racks: Rack[] = [];
      racksSnapshot.forEach((childSnapshot) => {
        racks.push({ shelves: [], ...childSnapshot.val() });
      });

      const unsubscribeShelves = onValue(shelvesRef, (shelvesSnapshot) => {
        const shelves: Shelf[] = [];
        shelvesSnapshot.forEach((childSnapshot) => {
          shelves.push({ id: childSnapshot.key!, ...childSnapshot.val() });
        });

        const organizedData: OrganizedData = {};

        racks.forEach((rack) => {
          rack.shelves = shelves.filter(
            (s) => s.roomNo === rack.roomNo && s.rackNo === rack.rackNo
          );
          if (!organizedData[rack.roomNo]) {
            organizedData[rack.roomNo] = [];
          }
          organizedData[rack.roomNo].push(rack);
        });

        const sortedRooms = Object.keys(organizedData).sort();
        const finalData: OrganizedData = {};
        sortedRooms.forEach((room) => {
          finalData[room] = organizedData[room].sort((a, b) =>
            a.rackNo.localeCompare(b.rackNo)
          );
        });

        setData(finalData);
        setLoading(false);
      });
      return () => unsubscribeShelves();
    });

    return () => unsubscribeRacks();
  }, []);

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Storage Layouts Found</CardTitle>
          <CardDescription>
            Go to the "Manage Storage" page to create your first storage layout.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sortedRooms = Object.keys(data).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Diagram</CardTitle>
        <CardDescription>
          A diagrammatic overview of your physical storage layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="multiple" defaultValue={sortedRooms} className="w-full space-y-4">
          {sortedRooms.map((room) => (
            <AccordionItem value={room} key={room} className="border rounded-md px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Building className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">Room: {room}</h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 border-t">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-4 bg-muted/20 rounded-lg">
                      {data[room].map((rack) => (
                      <Card key={rack.id} className="flex flex-col bg-background">
                          <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
                          <div className="flex items-center gap-3">
                              <Library className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{rack.rackNo}</CardTitle>
                          </div>
                           <div className="text-sm text-muted-foreground">
                                {rack.rows}x{rack.cols} Shelves
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 flex-1">
                            <div 
                                className="border-2 border-muted-foreground p-2 rounded-lg grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${rack.cols}, minmax(0, 1fr))` }}
                                >
                                {Array.from({length: rack.rows * rack.cols}).map((_, i) => (
                                    <div key={i} className="flex-1 flex items-center justify-center p-2 h-16 bg-muted/40 border-y-4 border-muted-foreground rounded-md text-center text-xs">
                                        Shelf {i + 1}
                                    </div>
                                ))}
                            </div>
                          </CardContent>
                      </Card>
                      ))}
                  </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
