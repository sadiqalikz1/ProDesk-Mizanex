
'use client';
import { useState } from 'react';
import { getDatabase, ref, set, get } from 'firebase/database';
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
import { Shelf } from './types';

type NewRack = {
  id: string;
  name: string;
  rows: number;
  cols: number;
  shelfCapacity: number;
};

type NewRoom = {
  id: string;
  name: string;
  racks: NewRack[];
};

export default function StorageBuilder() {
  const [rooms, setRooms] = useState<NewRoom[]>([]);
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
                { id: `rack-${Date.now()}`, name: '', rows: 5, cols: 2, shelfCapacity: 10 },
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

  const handleRackChange = (roomId: string, rackId: string, field: keyof Omit<NewRack, 'id'>, value: string | number) => {
      setRooms(
        rooms.map(room => room.id === roomId ? {
            ...room,
            racks: room.racks.map(rack => rack.id === rackId ? { ...rack, [field]: value } : rack)
        } : room)
      )
  }

  const handleSaveLayout = async () => {
    const db = getDatabase(app);
    const shelvesMetaRef = ref(db, 'shelvesMetadata');
    const snapshot = await get(shelvesMetaRef);
    const existingData: {[key: string]: Shelf} = snapshot.val() || {};
    const existingRooms = new Set(Object.values(existingData).map(s => s.roomNo));
    const existingRacksByRoom: {[room: string]: Set<string>} = {};
    Object.values(existingData).forEach(s => {
        if (!existingRacksByRoom[s.roomNo]) {
            existingRacksByRoom[s.roomNo] = new Set();
        }
        existingRacksByRoom[s.roomNo].add(s.rackNo);
    });

    let newShelvesData: { [key: string]: any } = {};
    let error = false;

    if (rooms.length === 0) {
      toast({ title: 'Layout is empty', description: 'Please add at least one room to save.', variant: 'destructive'});
      return;
    }

    const newRoomNames = new Set<string>();
    for (const room of rooms) {
        const roomName = room.name.trim();
        if (!roomName) {
            toast({ title: 'Validation Error', description: 'A room name is missing.', variant: 'destructive'});
            error = true;
            break;
        }
        if (newRoomNames.has(roomName.toLowerCase()) || existingRooms.has(roomName)) {
            toast({ title: 'Duplicate Name', description: `Room name "${roomName}" already exists.`, variant: 'destructive'});
            error = true;
            break;
        }
        newRoomNames.add(roomName.toLowerCase());

        if (room.racks.length === 0) {
            toast({ title: 'Validation Error', description: `Room "${roomName}" has no racks.`, variant: 'destructive'});
            error = true;
            break;
        }

        const newRackNames = new Set<string>();
        for (const rack of room.racks) {
            const rackName = rack.name.trim();
            if (!rackName) {
                toast({ title: 'Validation Error', description: `A rack name is missing in room "${roomName}".`, variant: 'destructive'});
                error = true;
                break;
            }
            if (newRackNames.has(rackName.toLowerCase()) || existingRacksByRoom[roomName]?.has(rackName)) {
                toast({ title: 'Duplicate Name', description: `Rack name "${rackName}" already exists in room "${roomName}".`, variant: 'destructive'});
                error = true;
                break;
            }
            newRackNames.add(rackName.toLowerCase());

            if (isNaN(rack.rows) || isNaN(rack.cols) || rack.rows <= 0 || rack.cols <= 0) {
                toast({ title: 'Invalid Layout', description: `Layout for rack "${rackName}" must have positive numbers for rows and columns.`, variant: 'destructive'});
                error = true;
                break;
            }
            
            const totalShelves = rack.rows * rack.cols;
            
            for(let i = 1; i <= totalShelves; i++) {
                const shelfId = `${roomName}-${rackName}-${i}`.replace(/\s+/g, '-');
                newShelvesData[shelfId] = {
                    id: shelfId,
                    roomNo: roomName,
                    rackNo: rackName,
                    shelfNo: String(i),
                    capacity: Number(rack.shelfCapacity)
                };
            }
        }
        if (error) break;
    }


    if (error) return;
    
    try {
        const combinedData = {...existingData, ...newShelvesData };

        await set(shelvesMetaRef, combinedData);
        toast({ title: 'Layout Saved', description: 'Your storage layout has been successfully saved.' });
        setRooms([]);
    } catch (e) {
        toast({ title: 'Save Error', description: 'There was a problem saving your layout.', variant: 'destructive' });
        console.error(e);
    }

  };

  const renderShelfPreview = (rack: NewRack) => {
    const { rows, cols } = rack;
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
        <CardTitle>Create New Storage Layout</CardTitle>
        <CardDescription>
          Define your physical storage layout. Add rooms, then add racks to each room with a defined shelf structure. Your saved layouts will be combined with any existing ones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center border-t pt-6">
            <Button onClick={handleAddRoom}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Room
            </Button>
            <Button onClick={handleSaveLayout} disabled={rooms.length === 0}>
                Save Current Layout Additions
            </Button>
        </div>

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
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                     <div className="space-y-2">
                                        <Label>Number of Rows</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 5"
                                            value={rack.rows}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'rows', parseInt(e.target.value, 10) || 0)}
                                            min="1"
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Number of Columns</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 2"
                                            value={rack.cols}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'cols', parseInt(e.target.value, 10) || 0)}
                                            min="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File Capacity per Shelf</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={rack.shelfCapacity}
                                            onChange={(e) => handleRackChange(room.id, rack.id, 'shelfCapacity', parseInt(e.target.value, 10) || 0)}
                                            min="1"
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
      </CardContent>
    </Card>
  );
}
