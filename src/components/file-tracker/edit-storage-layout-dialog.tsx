
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, update, set, get, remove } from 'firebase/database';
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
import { Rack } from './types';
import { Library, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


export function EditStorageLayoutDialog({
  isOpen,
  setIsOpen,
  rack,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rack: Rack;
}) {
  const [rackName, setRackName] = useState(rack.rackNo);
  const [rows, setRows] = useState(rack.rows);
  const [cols, setCols] = useState(rack.cols);
  const [capacity, setCapacity] = useState(rack.capacity);
  const { toast } = useToast();

  useEffect(() => {
    if (rack && isOpen) {
      setRackName(rack.rackNo);
      setRows(rack.rows);
      setCols(rack.cols);
      setCapacity(rack.capacity);
    }
  }, [rack, isOpen]);

  const handleSave = async () => {
    const db = getDatabase(app);

    if (rackName.trim() !== rack.rackNo) {
        const racksRef = ref(db, 'racksMetadata');
        const snapshot = await get(racksRef);
        const allRacks = snapshot.val() || {};
        const rackExists = Object.values(allRacks).some((r: any) => r.roomNo === rack.roomNo && r.rackNo === rackName.trim());
        if (rackExists) {
            toast({ title: 'Validation Error', description: `Rack name "${rackName}" already exists in this room.`, variant: 'destructive'});
            return;
        }
    }

    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
        toast({ title: 'Invalid Layout', description: `Layout must have positive numbers for rows and columns.`, variant: 'destructive'});
        return;
    }
    if (isNaN(capacity) || capacity <= 0) {
        toast({ title: 'Invalid Capacity', description: `Capacity must be a positive number.`, variant: 'destructive'});
        return;
    }
    
    // Check if there are files in shelves that will be deleted
    const oldTotalShelves = rack.rows * rack.cols;
    const newTotalShelves = rows * cols;
    if (newTotalShelves < oldTotalShelves) {
        const entriesRef = ref(db, 'entries');
        const entriesSnap = await get(entriesRef);
        const allEntries = entriesSnap.val() || {};
        const filesInDeletedShelves = Object.values(allEntries).filter((entry: any) =>
            entry.roomNo === rack.roomNo &&
            entry.rackNo === rack.rackNo &&
            parseInt(entry.shelfNo) > newTotalShelves
        );
        if (filesInDeletedShelves.length > 0) {
            toast({
                title: 'Cannot Update Rack',
                description: `There are ${filesInDeletedShelves.length} file(s) in shelves that would be deleted. Please move them before reducing the number of shelves.`,
                variant: 'destructive',
                duration: 9000,
            });
            return;
        }
    }

    // Delete old rack and its shelves
    const rackRef = ref(db, `racksMetadata/${rack.id}`);
    await remove(rackRef);
    for (const shelf of rack.shelves) {
        const shelfRef = ref(db, `shelvesMetadata/${shelf.id}`);
        await remove(shelfRef);
    }

    // Create new rack and shelves
    const newRackId = `${rack.roomNo}-${rackName.trim()}`.replace(/\s+/g, '-');
    const newRackRef = ref(db, `racksMetadata/${newRackId}`);
    const newRackData = {
        id: newRackId,
        roomNo: rack.roomNo,
        rackNo: rackName.trim(),
        rows: Number(rows),
        cols: Number(cols),
        capacity: Number(capacity)
    };
    await set(newRackRef, newRackData);
    
    const newShelvesData: {[key:string]: any} = {};
    const totalShelves = rows * cols;
    for (let i = 1; i <= totalShelves; i++) {
        const shelfId = `${newRackId}-${i}`;
        newShelvesData[shelfId] = {
            id: shelfId,
            roomNo: rack.roomNo,
            rackNo: rackName.trim(),
            shelfNo: String(i),
            capacity: Number(capacity)
        };
    }
    const shelvesMetaRef = ref(db, 'shelvesMetadata');
    await update(shelvesMetaRef, newShelvesData);
    
    // Potentially update entries if rack name changed
    if (rack.rackNo !== rackName.trim()) {
        const entriesRef = ref(db, 'entries');
        const entriesSnap = await get(entriesRef);
        const allEntries = entriesSnap.val() || {};
        const updates: {[key: string]: any} = {};
        Object.keys(allEntries).forEach(key => {
            const entry = allEntries[key];
            if (entry.roomNo === rack.roomNo && entry.rackNo === rack.rackNo) {
                updates[`/entries/${key}/rackNo`] = rackName.trim();
            }
        });
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
    }

    toast({
      title: 'Rack Updated',
      description: `Rack ${rack.rackNo} has been successfully updated.`,
    });
    setIsOpen(false);
  };

  const handleDeleteRack = async () => {
    const db = getDatabase(app);
    
    // Check if there are files in this rack
    const entriesRef = ref(db, 'entries');
    const entriesSnap = await get(entriesRef);
    const allEntries = entriesSnap.val() || {};
    const filesInRack = Object.values(allEntries).some((entry: any) =>
        entry.roomNo === rack.roomNo && entry.rackNo === rack.rackNo
    );

    if (filesInRack) {
        toast({
            title: 'Cannot Delete Rack',
            description: 'This rack contains files. Please move all files from this rack before deleting it.',
            variant: 'destructive',
            duration: 9000,
        });
        return;
    }
    
    // Delete rack metadata
    const rackRef = ref(db, `racksMetadata/${rack.id}`);
    await remove(rackRef);
    
    // Delete associated shelves
    for (const shelf of rack.shelves) {
        const shelfRef = ref(db, `shelvesMetadata/${shelf.id}`);
        await remove(shelfRef);
    }
    
    toast({
        title: 'Rack Deleted',
        description: `Successfully deleted rack "${rack.rackNo}" and all its shelves.`,
        variant: 'destructive'
    })
    setIsOpen(false);
  }

  const renderShelfPreview = () => {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Rack: {rack.rackNo}</DialogTitle>
          <DialogDescription>
            Update the layout for this rack. Note: Changing the layout will regenerate all shelves. Files on deleted shelves will need to be reassigned.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <Library className="h-5 w-5 text-primary" />
                    <Input
                        placeholder="Enter Rack Name (e.g., Left Wall)"
                        value={rackName}
                        onChange={(e) => setRackName(e.target.value)}
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                    <Label>Number of Rows</Label>
                    <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value, 10) || 0)}
                        min="1"
                    />
                </div>
                    <div className="space-y-2">
                    <Label>Number of Columns</Label>
                    <Input
                        type="number"
                        placeholder="e.g., 2"
                        value={cols}
                        onChange={(e) => setCols(parseInt(e.target.value, 10) || 0)}
                        min="1"
                    />
                </div>
                <div className="space-y-2">
                    <Label>File Capacity per Shelf</Label>
                    <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                        min="1"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Shelf Preview</Label>
                {renderShelfPreview()}
            </div>
        </div>
        <DialogFooter className="justify-between">
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Rack
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the rack "{rack.rackNo}" and all its shelves. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRack}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
