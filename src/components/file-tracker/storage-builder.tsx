
'use client';
import { useState } from 'react';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Library, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

type Rack = {
  id: string;
  name: string;
  layout: string; // e.g., "5x2"
  shelfCapacity: number;
};

type Room = {
  id: string;
  name: string;
  racks: Rack[];
};

export default function StorageBuilder() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { toast } = useToast();

  const handleAddRoom = () => {
    setRooms([
      ...rooms,
      { id: `room-${Date.now()}`, name: '', racks: [] },
    ]);
  };

  const handleRemoveRoom = (roomId: string) => {
    setRooms(rooms.filter((room) => room.id !== roomId));
  };

  const handleRoomChange = (roomId: string, name: string) => {
    setRooms(
      rooms.map((room) => (room.id === roomId ? { ...room, name } : room))
    );
  };

  const handleAddRack = (roomId: string) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              racks: [
                ...room.racks,
                { id: `rack-${Date.now()}`, name: '', layout: '5x2', shelfCapacity: 10 },
              ],
            }
          : room
      )
    );
  };

  const handleRemoveRack = (roomId: string, rackId: string) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? { ...room, racks: room.racks.filter((rack) => rack.id !== rackId) }
          : room
      )
    );
  };

  const handleRackChange = (roomId: string, rackId: string, field: keyof Rack, value: string | number) => {
      setRooms(
        rooms.map(room => room.id === roomId ? {
            ...room,
            racks: room.racks.map(rack => rack.id === rackId ? { ...rack, [field]: value } : rack)
        } : room)
      )
  }

  const handleSaveLayout = async () => {
    const db = getDatabase(app);
    let allShelvesData: { [key: string]: any } = {};
    let error = false;

    rooms.forEach(room => {
        if (!room.name.trim()) {
            toast({ title: 'Validation Error', description: `A room name is missing.`, variant: 'destructive'});
            error = true;
            return;
        }
        room.racks.forEach(rack => {
            if (!rack.name.trim()) {
                toast({ title: 'Validation Error', description: `A rack name is missing in room "${room.name}".`, variant: 'destructive'});
                error = true;
                return;
            }

            const layoutParts = rack.layout.toLowerCase().split('x');
            if (layoutParts.length !== 2 || isNaN(parseInt(layoutParts[0])) || isNaN(parseInt(layoutParts[1]))) {
                toast({ title: 'Invalid Layout', description: `Layout for rack "${rack.name}" must be in format "rowsxcols" (e.g., 5x2).`, variant: 'destructive'});
                error = true;
                return;
            }
            
            const rows = parseInt(layoutParts[0]);
            const cols = parseInt(layoutParts[1]);
            const totalShelves = rows * cols;
            
            for(let i = 1; i <= totalShelves; i++) {
                const shelfId = `${room.name}-${rack.name}-${i}`.replace(/\s+/g, '-');
                allShelvesData[shelfId] = {
                    id: shelfId,
                    roomNo: room.name,
                    rackNo: rack.name,
                    shelfNo: String(i),
                    capacity: Number(rack.shelfCapacity)
                };
            }
        });
    });

    if (error) return;
    
    try {
        const shelvesMetaRef = ref(db, 'shelvesMetadata');
        await set(shelvesMetaRef, allShelvesData);
        toast({ title: 'Layout Saved', description: 'Your storage layout has been successfully saved.' });
        setRooms([]);
    } catch (e) {
        toast({ title: 'Save Error', description: 'There was a problem saving your layout.', variant: 'destructive' });
        console.error(e);
    }

  };

  const renderShelfPreview = (rack: Rack) => {
    const layoutParts = rack.layout.toLowerCase().split('x');
    if (layoutParts.length !== 2) return <p className='text-destructive text-sm'>Invalid layout format.</p>;
    const rows = parseInt(layoutParts[0]);
    const cols = parseInt(layoutParts[1]);

    if(isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return <p className='text-destructive text-sm'>Rows and columns must be positive numbers.</p>;
    
    let shelfCounter = 0;
    return (
        <div className="border-2 border-muted-foreground p-2 bg-muted/20 rounded-lg">
            <div className="flex flex-col gap-2">
                {Array.from({length: rows}).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2">
                         {Array.from({length: cols}).map((_, colIndex) => {
                            shelfCounter++;
                            return (
                                <div key={colIndex} className="flex-1 flex items-center justify-center p-2 h-16 bg-muted/40 border-y-4 border-muted-foreground rounded-md text-center text-xs">
                                   Shelf {shelfCounter}
                                </div>
                            )
                         })}
                    </div>
                ))}
            </div>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Layout Builder</CardTitle>
        <CardDescription>
          Define your physical storage layout. Add rooms, then add racks to each room with a defined shelf structure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            {rooms.map((room) => (
                <Card key={room.id} className="p-4 bg-background border-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Building className="h-6 w-6 text-primary" />
                            <Input 
                                placeholder="Enter Room Name (e.g., Main Office)"
                                value={room.name}
                                onChange={(e) => handleRoomChange(room.id, e.target.value)}
                                className="font-bold text-lg"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRoom(room.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>

                    <div className='pl-8 space-y-4'>
                        {room.racks.map(rack => (
                            <div key={rack.id} className="p-4 border rounded-md">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Library className="h-5 w-5 text-primary" />
                                        <Input
                                            placeholder="Enter Rack Name (e.g., Left Wall)"
                                            value={rack.name}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRack(room.id, rack.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                     <div className="space-y-2">
                                        <Label>Shelf Arrangement (Rows x Columns)</Label>
                                        <Input
                                            placeholder="e.g., 5x2"
                                            value={rack.layout}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'layout', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File Capacity per Shelf</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={rack.shelfCapacity}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'shelfCapacity', parseInt(e.target.value, 10) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Shelf Preview</Label>
                                    {renderShelfPreview(rack)}
                                </div>
                            </div>
                        ))}

                         <Button variant="outline" onClick={() => handleAddRack(room.id)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Rack to Room
                        </Button>
                    </div>
                </Card>
            ))}
        </div>

        <Button onClick={handleAddRoom}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Room
        </Button>

        <div className="border-t pt-6 flex justify-end">
            <Button onClick={handleSaveLayout} disabled={rooms.length === 0}>
                Save Storage Layout
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}
