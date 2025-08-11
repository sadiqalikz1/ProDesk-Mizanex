
'use client';
<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { getDatabase, ref, update, get, push } from 'firebase/database';
=======
import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, update, get, push, set } from 'firebase/database';
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
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
import { Entry } from './types';
import { AddSimpleItemDialog } from './add-simple-item-dialog';
import { PlusCircle, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

type ItemType = 'company' | 'fileType' | 'room' | 'rack' | 'shelf';

export function EditEntryDialog({
  isOpen,
  setIsOpen,
  entry,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: Entry;
}) {
  const [editedEntry, setEditedEntry] = useState<Entry>(entry);
  const [companies, setCompanies] = useState<string[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>([]);
<<<<<<< HEAD
    const [confirmation, setConfirmation] = useState<{
    type: 'company' | 'fileType' | null;
    value: string;
    open: boolean;
  }>({ type: null, value: '', open: false });
=======
  const [rooms, setRooms] = useState<string[]>([]);
  const [racks, setRacks] = useState<string[]>([]);
  const [shelves, setShelves] = useState<string[]>([]);
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
  const { toast } = useToast();

  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemDialogType, setAddItemDialogType] = useState<ItemType | null>(null);

  const [companySearch, setCompanySearch] = useState(entry.company || '');
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);


  const itemStates = {
    company: { list: companies, setList: setCompanies, dbPath: 'companies' },
    fileType: { list: docTypes, setList: setDocTypes, dbPath: 'docTypes' },
    room: { list: rooms, setList: setRooms, dbPath: 'rooms' },
    rack: { list: racks, setList: setRacks, dbPath: 'racks' },
    shelf: { list: shelves, setList: setShelves, dbPath: 'shelves' },
  };


  useEffect(() => {
    setEditedEntry(entry);
    setCompanySearch(entry.company || '');
    if (isOpen) {
        const db = getDatabase(app);
        const companiesRef = ref(db, 'companies');
        const docTypesRef = ref(db, 'docTypes');

        get(companiesRef).then((snapshot) => {
            if (snapshot.exists()) {
<<<<<<< HEAD
            setCompanies(Object.values(snapshot.val()));
=======
                const data = snapshot.val();
                 if (typeof data === 'object' && data !== null) {
                    setter(Object.values(data));
                } else if (Array.isArray(data)) {
                    setter(data.filter(v => typeof v === 'string'));
                }
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
            }
        });
        get(docTypesRef).then((snapshot) => {
            if (snapshot.exists()) {
            setDocTypes(Object.values(snapshot.val()));
            }
        });
    }
  }, [entry, isOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target as Node)) {
        setShowCompanyResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof Entry, value: any) => {
    setEditedEntry((prev) => ({ ...prev, [field]: value }));
  };

<<<<<<< HEAD
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
=======
  const handleOpenAddItemDialog = (type: ItemType) => {
    setAddItemDialogType(type);
    setAddItemDialogOpen(true);
  };

  const handleItemCreated = (type: ItemType, value: string) => {
     const fieldMap = {
        company: 'company',
        fileType: 'fileType',
        room: 'roomNo',
        rack: 'rackNo',
        shelf: 'shelfNo'
    } as const;
    const stateInfo = itemStates[type];
    if (!stateInfo.list.some(item => item.toLowerCase() === value.toLowerCase())) {
        stateInfo.setList(prev => [...prev, value]);
    }
    
    if (type === 'company') {
        setCompanySearch(value);
        handleChange('company', value);
    } else {
        handleChange(fieldMap[type], value);
    }
  };
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)

  const handleSave = async () => {
    if (!editedEntry.fileNo || !editedEntry.fileType || !editedEntry.company) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out File Name, File Type, and Company.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    const entryRef = ref(db, `entries/${entry.id}`);
    
    const entryToUpdate = { ...editedEntry };
    if (entryToUpdate.dateCreated instanceof Date) {
        entryToUpdate.dateCreated = entryToUpdate.dateCreated.toISOString();
    }

<<<<<<< HEAD

    // Firebase cannot store `id` within the object itself
    const { id, ...firebaseData } = entryToUpdate;

    await update(entryRef, firebaseData);
    
    const dbCompaniesRef = ref(db, 'companies');
    const dbDocTypesRef = ref(db, 'docTypes');
    const currentCompaniesSnap = await get(dbCompaniesRef);
    const currentCompanies = currentCompaniesSnap.exists() ? Object.values(currentCompaniesSnap.val()) : [];
    if (!currentCompanies.some((c:any) => c.toLowerCase() === editedEntry.company.toLowerCase())) {
        await push(dbCompaniesRef, editedEntry.company);
=======
    const { id, ...firebaseData } = entryToUpdate;

    await update(entryRef, firebaseData);

    if (editedEntry.roomNo && editedEntry.rackNo && editedEntry.shelfNo) {
        const shelfId = `${editedEntry.roomNo}-${editedEntry.rackNo}-${editedEntry.shelfNo}`;
        const shelfRef = ref(db, `shelvesMetadata/${shelfId}`);
        const shelfSnap = await get(shelfRef);
        if (!shelfSnap.exists()) {
            await set(shelfRef, {
                id: shelfId,
                roomNo: editedEntry.roomNo,
                rackNo: editedEntry.rackNo,
                shelfNo: editedEntry.shelfNo,
                capacity: 20, 
            });
        }
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
    }

    const currentDocTypesSnap = await get(dbDocTypesRef);
    const currentDocTypes = currentDocTypesSnap.exists() ? Object.values(currentDocTypesSnap.val()) : [];
    if (!currentDocTypes.some((d:any) => d.toLowerCase() === editedEntry.fileType.toLowerCase())) {
        await push(dbDocTypesRef, editedEntry.fileType);
    }

    toast({
      title: 'Entry Updated',
      description: `File ${editedEntry.fileNo} has been successfully updated.`,
    });
    setIsOpen(false);
  };

  const renderSelectWithAdd = (label: string, itemType: ItemType, value: string, placeholder: string) => {
    const { list } = itemStates[itemType];
    const fieldMap = {
      company: 'company',
      fileType: 'fileType',
      room: 'roomNo',
      rack: 'rackNo',
      shelf: 'shelfNo',
    } as const;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Select
            value={value || ''}
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
          <DialogTitle>Edit File Entry</DialogTitle>
          <DialogDescription>
            Update the details of the physical file record.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileNo">File Name</Label>
            <Input
              id="fileNo"
              value={editedEntry.fileNo || ''}
              onChange={(e) => handleChange('fileNo', e.target.value)}
            />
          </div>
          {renderSelectWithAdd("File Type", "fileType", editedEntry.fileType, "Select a file type...")}
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
                     {showCompanyResults && companySearch && filteredCompanies.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                            <CardContent className="p-2">
                                {filteredCompanies.map(company => (
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
                                ))}
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
              value={editedEntry.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
<<<<<<< HEAD
          <div className="space-y-2">
            <Label htmlFor="roomNo">Room Number</Label>
            <Input
              id="roomNo"
              value={editedEntry.roomNo || ''}
              onChange={(e) => handleChange('roomNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rackNo">Rack Number</Label>
            <Input
              id="rackNo"
              value={editedEntry.rackNo || ''}
              onChange={(e) => handleChange('rackNo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shelfNo">Shelf Number</Label>
            <Input
              id="shelfNo"
              value={editedEntry.shelfNo || ''}
              onChange={(e) => handleChange('shelfNo', e.target.value)}
            />
          </div>
=======
          {renderSelectWithAdd("Room Number", "room", editedEntry.roomNo, "Select a room...")}
          {renderSelectWithAdd("Rack Number", "rack", editedEntry.rackNo, "Select a rack...")}
          {renderSelectWithAdd("Shelf Number", "shelf", editedEntry.shelfNo, "Select a shelf...")}
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
          <div className="space-y-2">
            <Label htmlFor="boxNo">Box/Folder Number</Label>
            <Input
              id="boxNo"
              value={editedEntry.boxNo || ''}
              onChange={(e) => handleChange('boxNo', e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="owner">Person Responsible/Owner</Label>
            <Input
              id="owner"
              value={editedEntry.owner || ''}
              onChange={(e) => handleChange('owner', e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedEntry.status}
              onValueChange={(value) => handleChange('status', value)}
              disabled={editedEntry.status === 'Closed'}
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
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
<<<<<<< HEAD
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
=======
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
>>>>>>> ffdb343 (RACK CREATION METHOD ADDED)
    </>
  );
}
