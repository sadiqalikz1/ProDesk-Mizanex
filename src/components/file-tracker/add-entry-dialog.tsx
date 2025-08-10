
'use client';
import { useState, useEffect } from 'react';
import { getDatabase, ref, push, get, set, child } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';

const INITIAL_STATE = {
  fileNo: '',
  fileType: '',
  company: '',
  dateCreated: new Date(),
  description: '',
  owner: '',
  roomNo: '',
  rackNo: '',
  shelfNo: '',
  boxNo: '',
  status: 'In Storage',
  locationHistory: [],
};

export function AddEntryDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id'>>(INITIAL_STATE);
  const [companies, setCompanies] = useState<string[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [racks, setRacks] = useState<string[]>([]);
  const [shelves, setShelves] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<{
    type: 'company' | 'fileType' | 'room' | 'rack' | 'shelf' | null;
    value: string;
    open: boolean;
  }>({ type: null, value: '', open: false });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const db = getDatabase(app);
      const fetchData = async (path: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const snapshot = await get(ref(db, path));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const values = Object.values(data).filter(v => typeof v === 'string') as string[];
          setter(Array.isArray(data) ? data : values);
        }
      }
      fetchData('companies', setCompanies);
      fetchData('docTypes', setDocTypes);
      fetchData('rooms', setRooms);
      fetchData('racks', setRacks);
      fetchData('shelves', setShelves);
    }
  }, [isOpen]);

  const handleChange = (field: keyof Omit<Entry, 'id'>, value: any) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmCreate = (type: 'company' | 'fileType' | 'room' | 'rack' | 'shelf', value: string) => {
    const existingMap = {
        company: companies,
        fileType: docTypes,
        room: rooms,
        rack: racks,
        shelf: shelves,
    };
    const existing = existingMap[type];

    if (existing.some(item => typeof item === 'string' && item.toLowerCase() === value.toLowerCase())) {
        toast({
            title: 'Duplicate Entry',
            description: `"${value}" already exists.`,
            variant: 'destructive',
        });
        return;
    }
    setConfirmation({ type, value, open: true });
  }

  const handleCreateConfirmed = () => {
      if (confirmation.type && confirmation.value) {
        const setterMap = {
            company: setCompanies,
            fileType: setDocTypes,
            room: setRooms,
            rack: setRacks,
            shelf: setShelves
        };
        const fieldMap = {
            company: 'company',
            fileType: 'fileType',
            room: 'roomNo',
            rack: 'rackNo',
            shelf: 'shelfNo'
        } as const;
        
        setterMap[confirmation.type](prev => [...prev, confirmation.value]);
        handleChange(fieldMap[confirmation.type], confirmation.value);
      }
      setConfirmation({ type: null, value: '', open: false });
  }

  const handleSave = async (addAnother = false) => {
    if (!newEntry.fileNo || !newEntry.fileType || !newEntry.company) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out File Name, File Type, and Company.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');
    const newEntryRef = push(entriesRef);
    
    const initialHistory: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${newEntry.roomNo}, Rack: ${newEntry.rackNo}, Shelf: ${newEntry.shelfNo}, Box: ${newEntry.boxNo}`,
      status: 'Created',
      updatedBy: newEntry.owner,
      notes: `File created with description: ${newEntry.description}`
    };

    const entryToSave = {
        ...newEntry,
        dateCreated: newEntry.dateCreated.toISOString(),
        locationHistory: [initialHistory],
    };

    await set(newEntryRef, entryToSave);

    const updateUniqueList = async (listRefPath: string, currentList: string[], newValue: string) => {
        if (newValue && !currentList.some((item: any) => item.toLowerCase() === newValue.toLowerCase())) {
            await push(ref(db, listRefPath), newValue);
        }
    };
    
    await updateUniqueList('companies', companies, newEntry.company);
    await updateUniqueList('docTypes', docTypes, newEntry.fileType);
    await updateUniqueList('rooms', rooms, newEntry.roomNo);
    await updateUniqueList('racks', racks, newEntry.rackNo);
    await updateUniqueList('shelves', shelves, newEntry.shelfNo);
    
    // Auto-create shelf if it's new
    if (newEntry.roomNo && newEntry.rackNo && newEntry.shelfNo) {
        const shelfId = `${newEntry.roomNo}-${newEntry.rackNo}-${newEntry.shelfNo}`;
        const shelfRef = ref(db, `shelvesMetadata/${shelfId}`);
        const shelfSnap = await get(shelfRef);
        if (!shelfSnap.exists()) {
            await set(shelfRef, {
                id: shelfId,
                roomNo: newEntry.roomNo,
                rackNo: newEntry.rackNo,
                shelfNo: newEntry.shelfNo,
                capacity: 20, // Default capacity
            });
        }
    }

    toast({
      title: 'Entry Saved',
      description: `File ${newEntry.fileNo} has been created.`,
    });

    if (addAnother) {
        setNewEntry(INITIAL_STATE);
    } else {
        setIsOpen(false);
        setNewEntry(INITIAL_STATE);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New File Entry</DialogTitle>
            <DialogDescription>
              Fill in the details of the physical file to create a new record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileNo">File Name</Label>
              <Input
                id="fileNo"
                value={newEntry.fileNo}
                onChange={(e) => handleChange('fileNo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileType">File Type</Label>
              <Combobox
                options={docTypes.map((t) => ({ value: t, label: t }))}
                value={newEntry.fileType}
                onChange={(value) => handleChange('fileType', value)}
                placeholder="Select or create type..."
                createLabel="Create new type"
                onConfirmCreate={(value) => handleConfirmCreate('fileType', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company/Department</Label>
               <Combobox
                options={companies.map((c) => ({ value: c, label: c }))}
                value={newEntry.company}
                onChange={(value) => handleChange('company', value)}
                placeholder="Select or create company..."
                createLabel="Create new company"
                onConfirmCreate={(value) => handleConfirmCreate('company', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Person Responsible/Owner</Label>
              <Input
                id="owner"
                value={newEntry.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description/Notes</Label>
              <Input
                id="description"
                value={newEntry.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNo">Room Number</Label>
              <Combobox
                options={rooms.map((r) => ({ value: r, label: r }))}
                value={newEntry.roomNo}
                onChange={(value) => handleChange('roomNo', value)}
                placeholder="Select or create room..."
                createLabel="Create new room"
                onConfirmCreate={(value) => handleConfirmCreate('room', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rackNo">Rack Number</Label>
              <Combobox
                options={racks.map((r) => ({ value: r, label: r }))}
                value={newEntry.rackNo}
                onChange={(value) => handleChange('rackNo', value)}
                placeholder="Select or create rack..."
                createLabel="Create new rack"
                onConfirmCreate={(value) => handleConfirmCreate('rack', value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="shelfNo">Shelf Number</Label>
              <Combobox
                options={shelves.map((s) => ({ value: s, label: s }))}
                value={newEntry.shelfNo}
                onChange={(value) => handleChange('shelfNo', value)}
                placeholder="Select or create shelf..."
                createLabel="Create new shelf"
                onConfirmCreate={(value) => handleConfirmCreate('shelf', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boxNo">Box/Folder Number</Label>
              <Input
                id="boxNo"
                value={newEntry.boxNo}
                onChange={(e) => handleChange('boxNo', e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newEntry.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Storage">In Storage</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(true)}>Save & Add Another</Button>
            <Button onClick={() => handleSave(false)}>Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmation.open} onOpenChange={(open) => !open && setConfirmation({type: null, value: '', open: false})}>
        <AlertDialogContent onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateConfirmed();
          }
        }}>
            <AlertDialogHeader>
                <AlertDialogTitle>Create new {confirmation.type?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to create a new entry for "{confirmation.value}"?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateConfirmed}>Create</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
