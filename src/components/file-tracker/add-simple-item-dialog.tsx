
'use client';
import { useState } from 'react';
import { getDatabase, ref, push } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type AddSimpleItemDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  itemType: string;
  existingItems: string[];
  onItemCreated: (value: string) => void;
  dbPath: string;
};

export function AddSimpleItemDialog({
  isOpen,
  setIsOpen,
  itemType,
  existingItems,
  onItemCreated,
  dbPath,
}: AddSimpleItemDialogProps) {
  const [itemName, setItemName] = useState('');
  const { toast } = useToast();

  const handleCreate = async () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      toast({
        title: 'Name is required',
        description: `Please enter a name for the new ${itemType}.`,
        variant: 'destructive',
      });
      return;
    }

    if (existingItems.some(item => item.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        title: 'Duplicate Item',
        description: `An item named "${trimmedName}" already exists.`,
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const itemRef = ref(db, dbPath);
    await push(itemRef, trimmedName);
    
    toast({
        title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Created`,
        description: `Successfully created "${trimmedName}".`,
    });

    onItemCreated(trimmedName);
    setItemName('');
    setIsOpen(false);
  };
  
  const handleClose = () => {
      setItemName('');
      setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreate();
          }
      }}>
        <DialogHeader>
          <DialogTitle>Add New {itemType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DialogTitle>
          <DialogDescription>
            Create a new {itemType} to be used in your file records.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Label htmlFor="item-name">Name</Label>
            <Input 
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={`Enter the new ${itemType} name`}
                autoFocus
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
