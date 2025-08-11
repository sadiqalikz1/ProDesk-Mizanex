
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
import { Button } from '@/components/ui/button';
import { Edit, Library, Building } from 'lucide-react';
import { Shelf, Rack } from './types';
import { EditStorageLayoutDialog } from './edit-storage-layout-dialog';

type OrganizedData = {
  [room: string]: Rack[];
};

export default function ExistingStorageLayout() {
  const [data, setData] = useState<OrganizedData>({});
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);

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

          racks.forEach(rack => {
              rack.shelves = shelves.filter(s => s.roomNo === rack.roomNo && s.rackNo === rack.rackNo);
              if (!organizedData[rack.roomNo]) {
                  organizedData[rack.roomNo] = [];
              }
              organizedData[rack.roomNo].push(rack);
          });


          // Sort rooms, and racks within rooms
          const sortedRooms = Object.keys(organizedData).sort();
          const finalData: OrganizedData = {};
          sortedRooms.forEach(room => {
              finalData[room] = organizedData[room].sort((a,b) => a.rackNo.localeCompare(b.rackNo));
          });
          
          setData(finalData);
          setLoading(false);
      });
      return () => unsubscribeShelves();
    });

    return () => unsubscribeRacks();
  }, []);

  const handleEditRack = (rack: Rack) => {
    setSelectedRack(rack);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Existing Layout...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  if (Object.keys(data).length === 0) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>No Existing Layouts Found</CardTitle>
                <CardDescription>
                Use the form above to create your first storage layout.
                </CardDescription>
            </CardHeader>
        </Card>
     )
  }

  const sortedRooms = Object.keys(data).sort();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Existing Storage Layout</CardTitle>
          <CardDescription>
            View and manage your currently saved physical storage layouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedRooms.map((room) => (
            <div key={room}>
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Room: {room}</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pl-8">
                {data[room].map((rack) => (
                  <Card key={rack.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
                      <div className="flex items-center gap-3">
                         <Library className="h-5 w-5 text-primary" />
                         <CardTitle className="text-lg">{rack.rackNo}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditRack(rack)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <dl className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Rows</dt>
                            <dd className="font-bold">{rack.rows}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Columns</dt>
                            <dd className="font-bold">{rack.cols}</dd>
                        </div>
                         <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Shelves</dt>
                            <dd className="font-bold">{rack.rows * rack.cols}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Capacity per Shelf</dt>
                            <dd className="font-bold">{rack.capacity}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedRack && (
        <EditStorageLayoutDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          rack={selectedRack}
        />
      )}
    </>
  );
}
