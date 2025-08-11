
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, set, remove } from 'firebase/database';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Entry } from './types';

type SimpleListItem = {
    id: string;
    name: string;
}

type StorageItemType = 'rooms' | 'racks' | 'shelves';

export default function StorageManager() {
  const [rooms, setRooms] = useState<string[]>([]);
  const [racks, setRacks] = useState<string[]>([]);
  const [shelves, setShelves] = useState<SimpleListItem[]>([]);
  const [newShelf, setNewShelf] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    
    // Fetch unique rooms and racks from entries
    const entriesRef = ref(db, 'entries');
    const unsubscribeEntries = onValue(entriesRef, (snapshot) => {
        const data = snapshot.val() as { [key: string]: Entry };
        if (data) {
            const uniqueRooms = new Set<string>();
            const uniqueRacks = new Set<string>();
            Object.values(data).forEach(entry => {
                if(entry.roomNo) uniqueRooms.add(entry.roomNo);
                if(entry.rackNo) uniqueRacks.add(entry.rackNo);
            });
            setRooms(Array.from(uniqueRooms).sort());
            setRacks(Array.from(uniqueRacks).sort());
        } else {
            setRooms([]);
            setRacks([]);
        }
    });

    // Fetch shelves (as they can be pre-defined)
    const shelvesRef = ref(db, 'shelves');
    const unsubscribeShelves = onValue(shelvesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedItems: SimpleListItem[] = data 
            ? Object.keys(data).map(key => ({ id: key, name: data[key] })) 
            : [];
        setShelves(loadedItems);
    });
    
    return () => {
        unsubscribeEntries();
        unsubscribeShelves();
    }
  }, []);

  const handleAddShelf = async () => {
    const trimmedValue = newShelf.trim();

    if (!trimmedValue) {
        toast({ title: 'Name is required', description: `Please enter a name for the new shelf.`, variant: 'destructive' });
        return;
    }
    if (shelves.some(item => item.name.toLowerCase() === trimmedValue.toLowerCase())) {
        toast({ title: 'Duplicate Item', description: `An item named "${trimmedValue}" already exists.`, variant: 'destructive' });
        return;
    }

    const db = getDatabase(app);
    const itemRef = ref(db, 'shelves');
    const newItemRef = push(itemRef);
    await set(newItemRef, trimmedValue);

    toast({ title: `Shelf Added`, description: `Successfully added "${trimmedValue}".` });
    setNewShelf('');
  };
  
  const handleDeleteShelf = async (item: SimpleListItem) => {
      const db = getDatabase(app);
      const itemRef = ref(db, `shelves/${item.id}`);
      await remove(itemRef);
      toast({ title: `Shelf Deleted`, description: `Successfully deleted "${item.name}".`, variant: 'destructive'});
  }

  const renderReadOnlyCard = (title: string, items: string[]) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  List of all {title.toLowerCase()} currently in use. Create new ones when adding files.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="h-72 w-full overflow-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item}>
                                    <TableCell>{item}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderReadOnlyCard('Rooms', rooms)}
        {renderReadOnlyCard('Racks', racks)}
         <Card>
            <CardHeader>
                <CardTitle>Shelves</CardTitle>
                <CardDescription>Add, view, or remove shelves.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input 
                        value={newShelf}
                        onChange={(e) => setNewShelf(e.target.value)}
                        placeholder="Add a new shelf..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddShelf();
                            }
                        }}
                    />
                    <Button onClick={handleAddShelf} size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 <div className="h-64 w-full overflow-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shelves.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteShelf(item)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
