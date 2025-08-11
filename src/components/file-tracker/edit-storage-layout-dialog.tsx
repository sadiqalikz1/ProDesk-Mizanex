
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
  const [editedRack, setEditedRack] = useState({ ...rack });
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (rack && rack.shelves.length > 0) {
      setEditedRack({ ...rack });
      // Infer rows and cols from shelf numbers, assuming they are numeric and sequential
      const shelfNumbers = rack.shelves.map(s => parseInt(s.shelfNo, 10)).filter(n => !isNaN(n));
      const maxShelf = Math.max(...shelfNumbers);
      // This is a guess, we cannot know the original rows/cols. User must re-enter.
      setRows(maxShelf); 
      setCols(1);
      setCapacity(rack.shelves[0].capacity);
    }
  }, [rack, isOpen]);

  const handleSave = async () => {
    if (!editedRack.rackNo.trim()) {
        toast({ title: 'Validation Error', description: `Rack name cannot be empty.`, variant: 'destructive'});
        return;
    }
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
        toast({ title: 'Invalid Layout', description: `Layout must have positive numbers for rows and columns.`, variant: 'destructive'});
        return;
    }
    if (isNaN(capacity) || capacity <= 0) {
        toast({ title: 'Invalid Capacity', description: `Capacity must be a positive number.`, variant: 'destructive'});
        return;
    }

    const db = getDatabase(app);
    const shelvesMetaRef = ref(db, 'shelvesMetadata');
    const snapshot = await get(shelvesMetaRef);
    const allShelves = snapshot.val() || {};
    let updatedShelves = { ...allShelves };

    // Remove old shelves for this rack
    rack.shelves.forEach(shelf => {
      delete updatedShelves[shelf.id];
    });

    // Add new/updated shelves
    const totalShelves = rows * cols;
    for(let i = 1; i <= totalShelves; i++) {
        const shelfId = `${editedRack.roomNo}-${editedRack.rackNo}-${i}`.replace(/\s+/g, '-');
        updatedShelves[shelfId] = {
            id: shelfId,
            roomNo: editedRack.roomNo,
            rackNo: editedRack.rackNo,
            shelfNo: String(i),
            capacity: Number(capacity)
        };
    }
    
    await set(shelvesMetaRef, updatedShelves);
    
    toast({
      title: 'Rack Updated',
      description: `Rack ${rack.rackNo} has been successfully updated.`,
    });
    setIsOpen(false);
  };

  const handleDeleteRack = async () => {
    const db = getDatabase(app);
    const shelvesMetaRef = ref(db, 'shelvesMetadata');
    const snapshot = await get(shelvesMetaRef);
    const allShelves = snapshot.val() || {};
    let updatedShelves = { ...allShelves };
    
    // Remove all shelves associated with this rack
    rack.shelves.forEach(shelf => {
        delete updatedShelves[shelf.id];
    });
    
    await set(shelvesMetaRef, updatedShelves);
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
            Update the layout for this rack. Note: Changing the name or layout will regenerate all shelves, potentially orphaning files if shelf numbers change.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <Library className="h-5 w-5 text-primary" />
                    <Input
                        placeholder="Enter Rack Name (e.g., Left Wall)"
                        value={editedRack.rackNo}
                        onChange={(e) => setEditedRack({...editedRack, rackNo: e.target.value})}
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
