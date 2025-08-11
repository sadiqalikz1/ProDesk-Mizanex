
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, update } from 'firebase/database';
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
import { Shelf } from './types';

export function EditShelfDialog({
  isOpen,
  setIsOpen,
  shelf,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shelf: Shelf;
}) {
  const [capacity, setCapacity] = useState(shelf.capacity);
  const { toast } = useToast();

  useEffect(() => {
    if (shelf) {
      setCapacity(shelf.capacity);
    }
  }, [shelf]);

  const handleSave = async () => {
    if (capacity < 1 || isNaN(capacity)) {
        toast({
            title: 'Invalid Capacity',
            description: 'Capacity must be a number greater than 0.',
            variant: 'destructive',
        });
        return;
    }
    const db = getDatabase(app);
    const shelfRef = ref(db, `shelvesMetadata/${shelf.id}`);
    
    await update(shelfRef, { capacity: Number(capacity) });
    
    toast({
      title: 'Shelf Updated',
      description: `Shelf ${shelf.shelfNo} capacity set to ${capacity}.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shelf: {shelf.shelfNo}</DialogTitle>
          <DialogDescription>
            Update the properties of this shelf.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="capacity">Shelf Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
              placeholder="Enter shelf capacity"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
