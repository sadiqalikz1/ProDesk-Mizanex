
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

  const handleSave = async (addAnother = false) => {
    if (!newEntry.fileNo || !newEntry.fileType || !newEntry.company) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out Reference #, File Type, and Company.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entriesRef = ref(db, 'entries');
    const newEntryRef = push(entriesRef);
    
    const initialHistory: LocationHistory = {
      date: new Date().toISOString(),
      location: `Room: ${newEntry.roomNo}, Rack: ${newEntry.rackNo}, Box: ${newEntry.boxNo}`,
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
    if (!companies.includes(newEntry.company)) {
        const newCompanyRef = push(ref(db, 'companies'));
        await set(newCompanyRef, newEntry.company);
        setCompanies(prev => [...prev, newEntry.company]);
    }
    if (!docTypes.includes(newEntry.fileType)) {
        const newDocTypeRef = push(ref(db, 'docTypes'));
        await set(newDocTypeRef, newEntry.fileType);
        setDocTypes(prev => [...prev, newEntry.fileType]);
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
            <Label htmlFor="fileNo">Reference #</Label>
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
            <Label htmlFor="rackNo">Rack/Shelf Number</Label>
            <Input
              id="rackNo"
              value={newEntry.rackNo}
              onChange={(e) => handleChange('rackNo', e.target.value)}
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
          <div className="space-y-2">
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
  );
}
