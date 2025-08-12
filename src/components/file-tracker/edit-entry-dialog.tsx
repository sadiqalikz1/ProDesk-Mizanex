
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getDatabase, ref, update, get, set, onValue } from 'firebase/database';
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
import { Entry, LocationHistory, Shelf } from './types';
import { AddSimpleItemDialog } from './add-simple-item-dialog';
import { PlusCircle, Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';


type LocationData = {
  [room: string]: {
    [rack: string]: Shelf[];
  };
};

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
  const { toast } = useToast();

  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({});
  const [shelves, setShelves] = useState<Shelf[]>([]);

  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemDialogType, setAddItemDialogType] = useState<ItemType | null>(
    null
  );

  const [companySearch, setCompanySearch] = useState(entry.company || '');
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);

  const itemStates = {
    company: { list: companies, setList: setCompanies, dbPath: 'companies' },
    fileType: { list: docTypes, setList: setDocTypes, dbPath: 'docTypes' },
    room: { list: [], setList: () => {}, dbPath: 'rooms'},
    rack: { list: [], setList: () => {}, dbPath: 'racks'},
    shelf: { list: [], setList: () => {}, dbPath: 'shelves'},
  };

  useEffect(() => {
    setEditedEntry(entry);
    setCompanySearch(entry.company || '');
    if (isOpen) {
      const db = getDatabase(app);

      const fetchSimpleData = (path: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const dataRef = ref(db, path);
        const unsubscribe = onValue(dataRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const values = data ? Object.values(data) as string[] : [];
              setter(Array.from(new Set(values)));
            }
        });
        return unsubscribe;
      }
      const unsubCompanies = fetchSimpleData('companies', setCompanies);
      const unsubDocTypes = fetchSimpleData('docTypes', setDocTypes);

      const entriesRef = ref(db, 'entries');
       const unsubEntries = onValue(entriesRef, (snapshot) => {
          const entries: Entry[] = [];
          snapshot.forEach((childSnapshot) => {
            entries.push({ id: childSnapshot.key!, ...childSnapshot.val() });
          });
          setAllEntries(entries);
      });
      
      const shelvesRef = ref(db, 'shelvesMetadata');
      const unsubShelves = onValue(shelvesRef, (shelfSnapshot) => {
        const shelvesData: Shelf[] = [];
        const groupedData: LocationData = {};
        shelfSnapshot.forEach((childSnapshot) => {
          const shelf: Shelf = { id: childSnapshot.key!, ...childSnapshot.val() };
          shelvesData.push(shelf);
          
          const { roomNo, rackNo } = shelf;
          if (roomNo && rackNo) {
            if (!groupedData[roomNo]) groupedData[roomNo] = {};
            if (!groupedData[roomNo][rackNo]) groupedData[roomNo][rackNo] = [];
            groupedData[roomNo][rackNo].push(shelf);
          }
        });
        setShelves(shelvesData);
        setLocationData(groupedData);
      });

      return () => {
        unsubCompanies();
        unsubDocTypes();
        unsubEntries();
        unsubShelves();
      }
    }
  }, [entry, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        companySearchRef.current &&
        !companySearchRef.current.contains(event.target as Node)
      ) {
        setShowCompanyResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof Entry, value: any) => {
    setEditedEntry((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleLocationChange = (field: 'roomNo' | 'rackNo' | 'shelfNo', value: string) => {
      const updatedEntry = { ...editedEntry, [field]: value };
      if (field === 'roomNo') {
          updatedEntry.rackNo = '';
          updatedEntry.shelfNo = '';
          updatedEntry.boxNo = '';
      }
      if (field === 'rackNo') {
          updatedEntry.shelfNo = '';
          updatedEntry.boxNo = '';
      }
       if (field === 'shelfNo') {
          updatedEntry.boxNo = '';
      }
      setEditedEntry(updatedEntry);
  }


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
      shelf: 'shelfNo',
    } as const;
    
    if (type === 'fileType' || type === 'company') {
        const stateInfo = itemStates[type];
        if (!stateInfo.list.some( (item) => item.toLowerCase() === value.toLowerCase() )) {
          stateInfo.setList((prev) => [...prev, value]);
        }
    }
    
    handleChange(fieldMap[type], value);

    if (type === 'company') {
      setCompanySearch(value);
    }
  };

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

    const { id, ...firebaseData } = entryToUpdate;

    await update(entryRef, firebaseData);

    toast({
      title: 'Entry Updated',
      description: `File ${editedEntry.fileNo} has been successfully updated.`,
    });
    setIsOpen(false);
  };

  const filteredCompanies = companies.filter((c) =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );
  
  const roomOptions = Object.keys(locationData).sort();
  const rackOptions = editedEntry.roomNo ? Object.keys(locationData[editedEntry.roomNo] || {}).sort() : [];
  const shelfOptions = (editedEntry.roomNo && editedEntry.rackNo) ? (locationData[editedEntry.roomNo]?.[editedEntry.rackNo] || []).map(s => s.shelfNo).sort((a,b) => Number(a) - Number(b)) : [];
  
  const selectedShelfInfo = shelves.find(s => s.roomNo === editedEntry.roomNo && s.rackNo === editedEntry.rackNo && s.shelfNo === editedEntry.shelfNo);
  const occupiedPositions = useMemo(() => {
    if (!selectedShelfInfo) return [];
    return allEntries
      .filter(e => e.id !== editedEntry.id && e.roomNo === selectedShelfInfo.roomNo && e.rackNo === selectedShelfInfo.rackNo && e.shelfNo === selectedShelfInfo.shelfNo && e.boxNo)
      .map(f => parseInt(f.boxNo, 10))
      .filter(p => !isNaN(p));
  }, [editedEntry.roomNo, editedEntry.rackNo, editedEntry.shelfNo, editedEntry.id, allEntries, selectedShelfInfo]);


  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] flex flex-col h-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit File Entry</DialogTitle>
            <DialogDescription>
              Update the details of the physical file record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fileNo">File Name</Label>
                <Input
                  id="fileNo"
                  value={editedEntry.fileNo || ''}
                  onChange={(e) => handleChange('fileNo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                  <Label>File Type</Label>
                  <div className="flex gap-2">
                  <Select
                      value={editedEntry.fileType}
                      onValueChange={(val) => handleChange('fileType', val)}
                  >
                      <SelectTrigger>
                      <SelectValue placeholder="Select a file type..." />
                      </SelectTrigger>
                      <SelectContent>
                      {docTypes.map((item, index) => <SelectItem key={`${item}-${index}`} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => handleOpenAddItemDialog('fileType')}>
                      <PlusCircle className="h-4 w-4" />
                  </Button>
                  </div>
              </div>
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
                            filteredCompanies.map((company) => (
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
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No companies found.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => handleOpenAddItemDialog('company')}>
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
              
              <div className="space-y-2">
                  <Label>Room Number</Label>
                  <div className="flex gap-2">
                      <Select value={editedEntry.roomNo} onValueChange={(val) => handleLocationChange('roomNo', val)}>
                          <SelectTrigger><SelectValue placeholder="Select a room..." /></SelectTrigger>
                          <SelectContent>
                              {roomOptions.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Rack Number</Label>
                  <div className="flex gap-2">
                      <Select value={editedEntry.rackNo} onValueChange={(val) => handleLocationChange('rackNo', val)} disabled={!editedEntry.roomNo}>
                          <SelectTrigger><SelectValue placeholder="Select a rack..." /></SelectTrigger>
                          <SelectContent>
                              {rackOptions.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Shelf Number</Label>
                  <div className="flex gap-2">
                      <Select value={editedEntry.shelfNo} onValueChange={(val) => handleLocationChange('shelfNo', val)} disabled={!editedEntry.rackNo}>
                          <SelectTrigger><SelectValue placeholder="Select a shelf..." /></SelectTrigger>
                          <SelectContent>
                              {shelfOptions.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxNo">Box/Folder Number</Label>
                <Input
                  id="boxNo"
                  value={editedEntry.boxNo || ''}
                  onChange={(e) => handleChange('boxNo', e.target.value)}
                  disabled={!editedEntry.shelfNo}
                />
              </div>

              {selectedShelfInfo && (
                <div className="col-span-2 space-y-2">
                    <Label>Shelf Layout (Capacity: {selectedShelfInfo.capacity})</Label>
                    <Card className="p-2 bg-muted/50">
                        <div className="grid grid-cols-10 gap-2">
                            {Array.from({length: selectedShelfInfo.capacity}, (_, i) => {
                                const pos = i + 1;
                                const isOccupied = occupiedPositions.includes(pos);
                                const isCurrent = Number(entry.boxNo) === pos && entry.shelfNo === editedEntry.shelfNo;
                                
                                return (
                                    <div key={pos} className={cn(
                                        "flex items-center justify-center h-10 rounded-sm border-2 text-xs",
                                        isOccupied ? "bg-destructive/30 border-destructive" : "bg-green-500/30 border-green-500",
                                        isCurrent && "bg-blue-500/30 border-blue-500",
                                        Number(editedEntry.boxNo) === pos && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    onClick={() => !isOccupied && handleChange('boxNo', String(pos))}
                                    >
                                        {pos}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
              )}


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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {addItemDialogType && (
        <AddSimpleItemDialog
          isOpen={isAddItemDialogOpen}
          setIsOpen={setAddItemDialogOpen}
          itemType={addItemDialogType}
          existingItems={
            addItemDialogType === 'company' ? companies :
            addItemDialogType === 'fileType' ? docTypes :
            []
          }
          onItemCreated={(value) =>
            handleItemCreated(addItemDialogType, value)
          }
          dbPath={itemStates[addItemDialogType].dbPath}
        />
      )}
    </>
  );
}
