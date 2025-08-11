
'use client';
import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, push, get, set } from 'firebase/database';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Entry, LocationHistory } from './types';
import { AddSimpleItemDialog } from './add-simple-item-dialog';
import { PlusCircle, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

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

type ItemType = 'fileType' | 'room' | 'rack' | 'shelf' | 'company';

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
  const { toast } = useToast();

  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemDialogType, setAddItemDialogType] = useState<ItemType | null>(null);

  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);

  const itemStates = {
    fileType: { list: docTypes, setList: setDocTypes, dbPath: 'docTypes' },
    room: { list: rooms, setList: setRooms, dbPath: 'rooms' },
    rack: { list: racks, setList: setRacks, dbPath: 'racks' },
    shelf: { list: shelves, setList: setShelves, dbPath: 'shelves' },
    company: { list: companies, setList: setCompanies, dbPath: 'companies' },
  };

  useEffect(() => {
    if (isOpen) {
      const db = getDatabase(app);
      const fetchData = (path: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const dataRef = ref(db, path);
        get(dataRef).then((snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const loadedItems: string[] = [];
               if (typeof data === 'object' && data !== null) {
                 // Firebase pushes data with unique keys, so we need the values.
                 Object.values(data).forEach(item => {
                    if (typeof item === 'string') {
                        loadedItems.push(item);
                    }
                 });
               }
              setter(loadedItems);
            }
        });
      }
      fetchData('companies', setCompanies);
      fetchData('docTypes', setDocTypes);
      fetchData('rooms', setRooms);
      fetchData('racks', setRacks);
      fetchData('shelves', setShelves);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target as Node)) {
        setShowCompanyResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof Omit<Entry, 'id'>, value: any) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleOpenAddItemDialog = (type: ItemType) => {
    setAddItemDialogType(type);
    setAddItemDialogOpen(true);
  };

  const handleItemCreated = (type: ItemType, value: string) => {
     const fieldMap = {
        fileType: 'fileType',
        room: 'roomNo',
        rack: 'rackNo',
        shelf: 'shelfNo',
        company: 'company',
    } as const;
    const stateInfo = itemStates[type];
    if (!stateInfo.list.some(item => item.toLowerCase() === value.toLowerCase())) {
        stateInfo.setList(prev => [...prev, value]);
    }
    
    handleChange(fieldMap[type], value);

    if (type === 'company') {
        setCompanySearch(value);
    }
  };

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

    if (newEntry.roomNo && newEntry.rackNo && newEntry.shelfNo) {
        const shelfId = `${newEntry.roomNo}-${newEntry.rackNo}-${newEntry.shelfNo}`;
        const shelfRef = ref(db, `shelves/${shelfId}`);
        const shelfSnap = await get(shelfRef);
        if (!shelfSnap.exists()) {
            await set(shelfRef, {
                id: shelfId,
                roomNo: newEntry.roomNo,
                rackNo: newEntry.rackNo,
                shelfNo: newEntry.shelfNo,
                capacity: 20,
            });
        }
    }
    
    toast({
      title: 'Entry Saved',
      description: `File ${newEntry.fileNo} has been created.`,
    });

    if (addAnother) {
        setNewEntry(INITIAL_STATE);
        setCompanySearch('');
    } else {
        setIsOpen(false);
        setNewEntry(INITIAL_STATE);
        setCompanySearch('');
    }
  };

  const renderSelectWithAdd = (label: string, itemType: ItemType, value: string, placeholder: string) => {
    const { list } = itemStates[itemType];
    const fieldMap = {
      fileType: 'fileType',
      room: 'roomNo',
      rack: 'rackNo',
      shelf: 'shelfNo',
      company: 'company',
    } as const;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Select
            value={value}
            onValueChange={(val) => handleChange(fieldMap[itemType], val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {list.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleOpenAddItemDialog(itemType)}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  const filteredCompanies = companies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase()));

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
             {renderSelectWithAdd("File Type", "fileType", newEntry.fileType, "Select a file type...")}
             <div className="space-y-2 col-span-2">
                <Label>Company/Department</Label>
                 <div className="flex gap-2">
                     <div className="relative w-full" ref={companySearchRef}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for a company..."
                            value={companySearch}
                            onChange={(e) => {
                                setCompanySearch(e.target.value);
                                handleChange('company', e.target.value);
                                setShowCompanyResults(true);
                            }}
                            onFocus={() => setShowCompanyResults(true)}
                            className="pl-10"
                        />
                         {showCompanyResults && companySearch && (
                            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                                <CardContent className="p-2">
                                    {filteredCompanies.length > 0 ? (
                                        filteredCompanies.map(company => (
                                            <div 
                                                key={company}
                                                onClick={() => {
                                                    setCompanySearch(company);
                                                    handleChange('company', company);
                                                    setShowCompanyResults(false);
                                                }}
                                                className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                            >
                                                {company}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-sm text-muted-foreground">No companies found.</div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                     </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenAddItemDialog('company')}
                    >
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
             </div>
             <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description/Notes</Label>
              <Input
                id="description"
                value={newEntry.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            {renderSelectWithAdd("Room Number", "room", newEntry.roomNo, "Select a room...")}
            {renderSelectWithAdd("Rack Number", "rack", newEntry.rackNo, "Select a rack...")}
            {renderSelectWithAdd("Shelf Number", "shelf", newEntry.shelfNo, "Select a shelf...")}
            <div className="space-y-2">
              <Label htmlFor="boxNo">Box/Folder Number</Label>
              <Input
                id="boxNo"
                value={newEntry.boxNo}
                onChange={(e) => handleChange('boxNo', e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="owner">Person Responsible/Owner</Label>
              <Input
                id="owner"
                value={newEntry.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
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
      {addItemDialogType && (
        <AddSimpleItemDialog
            isOpen={isAddItemDialogOpen}
            setIsOpen={setAddItemDialogOpen}
            itemType={addItemDialogType}
            existingItems={itemStates[addItemDialogType].list}
            onItemCreated={(value) => handleItemCreated(addItemDialogType, value)}
            dbPath={itemStates[addItemDialogType].dbPath}
        />
      )}
    </>
  );
}
