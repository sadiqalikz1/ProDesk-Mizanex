
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

type SimpleListItem = {
    id: string;
    name: string;
}

type StorageItemType = 'rooms' | 'racks' | 'shelves';

export default function StorageManager() {
  const [rooms, setRooms] = useState<SimpleListItem[]>([]);
  const [racks, setRacks] = useState<SimpleListItem[]>([]);
  const [shelves, setShelves] = useState<SimpleListItem[]>([]);
  const [newRoom, setNewRoom] = useState('');
  const [newRack, setNewRack] = useState('');
  const [newShelf, setNewShelf] = useState('');

  const { toast } = useToast();

  const itemStates = {
    rooms: { list: rooms, setList: setRooms, value: newRoom, setValue: setNewRoom, title: 'Rooms' },
    racks: { list: racks, setList: setRacks, value: newRack, setValue: setNewRack, title: 'Racks' },
    shelves: { list: shelves, setList: setShelves, value: newShelf, setValue: setNewShelf, title: 'Shelves' },
  };

  useEffect(() => {
    const db = getDatabase(app);
    const fetchData = (path: StorageItemType, setter: React.Dispatch<React.SetStateAction<SimpleListItem[]>>) => {
        const itemRef = ref(db, path);
        return onValue(itemRef, (snapshot) => {
            const data = snapshot.val();
            const loadedItems: SimpleListItem[] = data 
                ? Object.keys(data).map(key => ({ id: key, name: data[key] })) 
                : [];
            setter(loadedItems);
        });
    }

    const unsubscribeRooms = fetchData('rooms', setRooms);
    const unsubscribeRacks = fetchData('racks', setRacks);
    const unsubscribeShelves = fetchData('shelves', setShelves);
    
    return () => {
        unsubscribeRooms();
        unsubscribeRacks();
        unsubscribeShelves();
    }
  }, []);

  const handleAddItem = async (itemType: StorageItemType) => {
    const { list, value, setValue, title } = itemStates[itemType];
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        toast({ title: 'Name is required', description: `Please enter a name for the new ${title.slice(0, -1)}.`, variant: 'destructive' });
        return;
    }
    if (list.some(item => item.name.toLowerCase() === trimmedValue.toLowerCase())) {
        toast({ title: 'Duplicate Item', description: `An item named "${trimmedValue}" already exists.`, variant: 'destructive' });
        return;
    }

    const db = getDatabase(app);
    const itemRef = ref(db, itemType);
    const newItemRef = push(itemRef);
    await set(newItemRef, trimmedValue);

    toast({ title: `${title.slice(0,-1)} Added`, description: `Successfully added "${trimmedValue}".` });
    setValue('');
  };
  
  const handleDeleteItem = async (itemType: StorageItemType, item: SimpleListItem) => {
      const db = getDatabase(app);
      const itemRef = ref(db, `${itemType}/${item.id}`);
      await remove(itemRef);
      toast({ title: `${itemStates[itemType].title.slice(0, -1)} Deleted`, description: `Successfully deleted "${item.name}".`, variant: 'destructive'});
  }

  const renderManagerCard = (itemType: StorageItemType) => {
    const { list, value, setValue, title } = itemStates[itemType];
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Add, view, or remove {title.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input 
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Add a new ${title.slice(0,-1).toLowerCase()}...`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddItem(itemType);
                            }
                        }}
                    />
                    <Button onClick={() => handleAddItem(itemType)} size="icon">
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
                            {list.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(itemType, item)}>
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
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {renderManagerCard('rooms')}
        {renderManagerCard('racks')}
        {renderManagerCard('shelves')}
    </div>
  );
}
