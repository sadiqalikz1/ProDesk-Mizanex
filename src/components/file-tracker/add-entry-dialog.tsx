
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
  const [confirmation, setConfirmation] = useState<{
    type: 'company' | 'fileType' | null;
    value: string;
    open: boolean;
  }>({ type: null, value: '', open: false });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const db = getDatabase(app);
      const companiesRef = ref(db, 'companies');
      const docTypesRef = ref(db, 'docTypes');

      get(companiesRef).then((snapshot) => {
        if (snapshot.exists()) {
          setCompanies(Object.values(snapshot.val()));
        }
      });
      get(docTypesRef).then((snapshot) => {
        if (snapshot.exists()) {
          setDocTypes(Object.values(snapshot.val()));
        }
      });
    }
  }, [isOpen]);

  const handleChange = (field: keyof Omit<Entry, 'id'>, value: any) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmCreate = (type: 'company' | 'fileType', value: string) => {
    const existing = type === 'company' ? companies : docTypes;
    if (existing.some(item => item.toLowerCase() === value.toLowerCase())) {
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
          if (confirmation.type === 'company') {
              setCompanies(prev => [...prev, confirmation.value]);
handleChange('company', confirmation.value);
          } else {
              setDocTypes(prev => [...prev, confirmation.value]);
              handleChange('fileType', confirmation.value);
          }
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

    // Add company and docType if new
    const dbCompaniesRef = ref(db, 'companies');
    const dbDocTypesRef = ref(db, 'docTypes');
    const currentCompaniesSnap = await get(dbCompaniesRef);
    const currentCompanies = currentCompaniesSnap.exists() ? Object.values(currentCompaniesSnap.val()) : [];
    if (!currentCompanies.some((c:any) => c.toLowerCase() === newEntry.company.toLowerCase())) {
        await push(dbCompaniesRef, newEntry.company);
    }

    const currentDocTypesSnap = await get(dbDocTypesRef);
    const currentDocTypes = currentDocTypesSnap.exists() ? Object.values(currentDocTypesSnap.val()) : [];
    if (!currentDocTypes.some((d:any) => d.toLowerCase() === newEntry.fileType.toLowerCase())) {
        await push(dbDocTypesRef, newEntry.fileType);
    }

    // Auto-create shelf if it doesn't exist
    if (newEntry.roomNo && newEntry.rackNo && newEntry.shelfNo) {
        const shelfId = `${newEntry.roomNo}-${newEntry.rackNo}-${newEntry.shelfNo}`;
        const shelfRef = ref(db, `shelves/${shelfId}`);
        const shelfSnap = await get(shelfRef);
        if (!shelfSnap.exists()) {
            await set(shelfRef, {
                roomNo: newEntry.roomNo,
                rackNo: newEntry.rackNo,
                shelfNo: newEntry.shelfNo,
                capacity: 20 // Default capacity
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
              <Input
                id="roomNo"
                value={newEntry.roomNo}
                onChange={(e) => handleChange('roomNo', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rackNo">Rack Number</Label>
              <Input
                id="rackNo"
                value={newEntry.rackNo}
                onChange={(e) => handleChange('rackNo', e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="shelfNo">Shelf Number</Label>
              <Input
                id="shelfNo"
                value={newEntry.shelfNo}
                onChange={(e) => handleChange('shelfNo', e.target.value)}
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
                <AlertDialogTitle>Create new {confirmation.type === 'company' ? 'Company' : 'File Type'}?</AlertDialogTitle>
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
