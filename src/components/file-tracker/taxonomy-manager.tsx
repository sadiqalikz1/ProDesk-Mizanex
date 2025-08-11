
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, remove } from 'firebase/database';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ListItem = {
  id: string;
  name: string;
};

type ItemType = 'companies' | 'docTypes' | 'shelves';

function ManagementSection({
  itemType,
  title,
  description,
}: {
  itemType: ItemType;
  title: string;
  description: string;
}) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const db = getDatabase(app);
    const itemsRef = ref(db, itemType);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedItems: ListItem[] = data
        ? Object.keys(data).map((key) => ({ id: key, name: data[key] }))
        : [];
      setItems(loadedItems.sort((a,b) => a.name.localeCompare(b.name)));
    });

    return () => unsubscribe();
  }, [itemType]);
  
  const handleAddItem = async () => {
    const trimmedValue = newItemName.trim();
    if (!trimmedValue) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
     if (items.some(item => item.name.toLowerCase() === trimmedValue.toLowerCase())) {
        toast({ title: 'Duplicate Item', description: `An item named "${trimmedValue}" already exists.`, variant: 'destructive' });
        return;
    }
    
    const db = getDatabase(app);
    const itemRef = ref(db, itemType);
    await push(itemRef, trimmedValue);
    
    toast({ title: `${title.slice(0,-1)} Added`, description: `Successfully added "${trimmedValue}".` });
    setNewItemName('');
  }
  
  const handleDeleteItem = async (item: ListItem) => {
      const db = getDatabase(app);
      const itemRef = ref(db, `${itemType}/${item.id}`);
      await remove(itemRef);
      toast({ title: `${title.slice(0,-1)} Deleted`, description: `Successfully deleted "${item.name}".`, variant: 'destructive'});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Add a new ${title.toLowerCase().slice(0,-1)}...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
            }}
          />
          <Button onClick={handleAddItem} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-96 w-full overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item)}
                    >
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
  );
}

export default function TaxonomyManager() {
  return (
    <Tabs defaultValue="companies">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="companies">Companies</TabsTrigger>
        <TabsTrigger value="docTypes">Document Types</TabsTrigger>
        <TabsTrigger value="shelves">Shelves</TabsTrigger>
      </TabsList>
      <TabsContent value="companies">
        <ManagementSection 
            itemType="companies"
            title="Companies"
            description="Manage the list of companies or departments."
        />
      </TabsContent>
      <TabsContent value="docTypes">
        <ManagementSection 
            itemType="docTypes"
            title="Document Types"
            description="Manage the types of documents you can track."
        />
      </TabsContent>
      <TabsContent value="shelves">
         <ManagementSection 
            itemType="shelves"
            title="Shelves"
            description="Manage shelf identifiers. Rooms and Racks are managed when creating files."
        />
      </TabsContent>
    </Tabs>
  );
}
