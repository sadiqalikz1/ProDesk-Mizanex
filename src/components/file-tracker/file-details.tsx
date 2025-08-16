

'use client'

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import { app } from "@/lib/firebase";
import * as XLSX from 'xlsx';
import { Entry, LocationHistory } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Download, Upload, MoreVertical, Edit, Trash2, Search, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { EditHistoryDialog } from "./edit-history-dialog";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { ImportVerificationDialog } from "./import-verification-dialog";

type Filters = {
    signed: 'any' | 'yes' | 'no';
    sealed: 'any' | 'yes' | 'no';
    hasContent: 'any' | 'yes' | 'no';
}

function DeleteHistoryDialog({ entry, onConfirm }: { entry: Entry, onConfirm: (selectedIndices: number[]) => void }) {
    const [selected, setSelected] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const deletableHistory = useMemo(() => 
        (entry.locationHistory || [])
            .map((h, index) => ({...h, originalIndex: index}))
            .filter(h => h.status !== 'Created')
    , [entry.locationHistory]);

    const toggleSelect = (index: number) => {
        setSelected(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === deletableHistory.length) {
        setSelected([]);
        } else {
        setSelected(deletableHistory.map(h => h.originalIndex));
        }
    };

    const handleConfirm = () => {
        onConfirm(selected);
        setSelected([]);
        setIsOpen(false);
    }
    
    const YesNoBadge = ({value}: {value: boolean | undefined}) => (
        <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
    )
    
    const getStatusVariant = (status: string) => {
        switch (status) {
          case 'In Storage': return 'default';
          case 'Checked Out': return 'secondary';
          case 'In Use': return 'destructive';
          case 'Closed':
          case 'Created':
          case 'Approved':
          case 'Sealed':
          case 'Signed':
            return 'outline';
          default: return 'default';
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="destructive" size="sm" disabled={entry.status === 'Closed'}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Records
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-4/5 flex flex-col">
                <DialogHeader>
                    <DialogTitle>Delete History Records</DialogTitle>
                    <DialogDescription>Select records to permanently delete from file: <span className='font-bold text-primary'>{entry.fileNo}</span></DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead className='w-12'>
                                    <Checkbox 
                                        checked={selected.length > 0 && selected.length === deletableHistory.length}
                                        onCheckedChange={toggleSelectAll}
                                        disabled={deletableHistory.length === 0}
                                    />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated By</TableHead>
                                <TableHead>Signed</TableHead>
                                <TableHead>Sealed</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deletableHistory.map(item => (
                                <TableRow key={item.originalIndex} onClick={() => toggleSelect(item.originalIndex)} className='cursor-pointer'>
                                    <TableCell>
                                        <Checkbox checked={selected.includes(item.originalIndex)} />
                                    </TableCell>
                                    <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                                    <TableCell>{item.updatedBy}</TableCell>
                                    <TableCell><YesNoBadge value={item.isSigned} /></TableCell>
                                    <TableCell><YesNoBadge value={item.isSealed} /></TableCell>
                                    <TableCell>{item.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={selected.length === 0}>
                            Delete Selected ({selected.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the {selected.length} selected history records. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirm}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    )

}


export default function FileDetails() {
    const searchParams = useSearchParams();
    const fileId = searchParams.get('id');
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importData, setImportData] = useState<any>(null);

    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<{item: LocationHistory, index: number} | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Filters>({
        signed: 'any',
        sealed: 'any',
        hasContent: 'any',
    });


    useEffect(() => {
        if (fileId) {
            const db = getDatabase(app);
            const entryRef = ref(db, `entries/${fileId}`);
            
            const unsubscribe = onValue(entryRef, (snapshot) => {
                if (snapshot.exists()) {
                    setEntry({ id: snapshot.key, ...snapshot.val() });
                } else {
                    setEntry(null);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [fileId]);

    const getStatusVariant = (status: string) => {
        switch (status) {
          case 'In Storage': return 'default';
          case 'Checked Out': return 'secondary';
          case 'In Use': return 'destructive';
          case 'Closed':
          case 'Approved':
          case 'Sealed':
          case 'Signed':
            return 'outline';
          default: return 'default';
        }
    };
    
    const getDocInfo = (notes: string) => {
      if (!notes) {
        return { docNumber: 'N/A', docPosition: 'N/A', remainingNotes: 'N/A' };
      }
      
      const docNumberMatch = notes.match(/#(\S+)/);
      const docPositionMatch = notes.match(/\(Pos: (\d+)\)/);
      
      const docNumber = docNumberMatch ? docNumberMatch[1] : 'N/A';
      const docPosition = docPositionMatch ? docPositionMatch[1] : 'N/A';
      
      const remainingNotes = notes.replace(/Added Doc: #\S+ \s?/, '')
                                  .replace(/\(Pos: \d+\)\s?/, '')
                                  .replace(/^- /, '')
                                  .trim();
  
      return { docNumber, docPosition, remainingNotes: remainingNotes || 'N/A' };
    }
    
    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !entry) {
            return;
        }

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                     toast({ title: 'Import Error', description: 'Could not read the file.', variant: 'destructive' });
                     return;
                }
                
                setImportData(data);
                setIsImporting(true);

            } catch (error) {
                console.error("Import error:", error);
                toast({
                    title: 'Import Failed',
                    description: 'There was an error processing the file.',
                    variant: 'destructive',
                });
            } finally {
                if(importInputRef.current) {
                    importInputRef.current.value = '';
                }
            }
        };

        reader.readAsBinaryString(file);
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!entry) {
        return <Card><CardHeader><CardTitle>File not found</CardTitle></CardHeader></Card>
    }

    const sortedHistory = [...(entry.locationHistory || [])]
        .map((h, index) => ({...h, originalIndex: index}))
        .filter(h => h.status !== 'Created')
        .sort((a,b) => {
          const posA = parseInt(getDocInfo(a.notes).docPosition, 10) || 0;
          const posB = parseInt(getDocInfo(b.notes).docPosition, 10) || 0;
          if (posB !== posA) {
            return posB - posA;
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        });
        
    const filteredHistory = sortedHistory.filter(item => {
        // Text search
        const { docPosition, docNumber, remainingNotes } = getDocInfo(item.notes);
        const lowercasedTerm = searchTerm.toLowerCase();
        const signedText = item.isSigned ? 'yes' : 'no';
        const sealedText = item.isSealed ? 'yes' : 'no';

        const matchesSearch = (
            item.status.toLowerCase().includes(lowercasedTerm) ||
            docPosition.toLowerCase().includes(lowercasedTerm) ||
            docNumber.toLowerCase().includes(lowercasedTerm) ||
            item.updatedBy.toLowerCase().includes(lowercasedTerm) ||
            remainingNotes.toLowerCase().includes(lowercasedTerm) ||
            new Date(item.date).toLocaleString().toLowerCase().includes(lowercasedTerm) ||
            signedText.includes(lowercasedTerm) ||
            sealedText.includes(lowercasedTerm)
        );

        // Advanced filters
        const matchesSigned = filters.signed === 'any' || (filters.signed === 'yes' && item.isSigned) || (filters.signed === 'no' && !item.isSigned);
        const matchesSealed = filters.sealed === 'any' || (filters.sealed === 'yes' && item.isSealed) || (filters.sealed === 'no' && !item.isSealed);
        const hasContent = item.notes?.startsWith('Added Doc:');
        const matchesContent = filters.hasContent === 'any' || (filters.hasContent === 'yes' && hasContent) || (filters.hasContent === 'no' && !hasContent);

        return matchesSearch && matchesSigned && matchesSealed && matchesContent;
    });

    const handleDownloadExcel = () => {
        const dataToExport = filteredHistory.map(item => {
            const { docPosition, docNumber, remainingNotes } = getDocInfo(item.notes);
            return {
                Date: new Date(item.date).toLocaleString(),
                Status: item.status,
                'Doc Position': docPosition,
                'Document #': docNumber,
                'Updated By': item.updatedBy,
                Signed: item.isSigned ? 'Yes' : 'No',
                Sealed: item.isSealed ? 'Yes' : 'No',
                Notes: remainingNotes,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "File History");

        const a = new Date();
        const datePart = `${a.getFullYear()}${(a.getMonth() + 1).toString().padStart(2, '0')}${a.getDate().toString().padStart(2, '0')}`;
        const timePart = `${a.getHours().toString().padStart(2, '0')}${a.getMinutes().toString().padStart(2, '0')}`;
        const fileName = `${entry.fileNo}_history_${datePart}-${timePart}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    }

    const YesNoBadge = ({value}: {value: boolean | undefined}) => (
        <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
    )

    const handleEditHistory = (item: LocationHistory, index: number) => {
        setSelectedHistoryItem({ item, index });
        setEditDialogOpen(true);
    };
    
    const handleDeleteHistory = (item: LocationHistory, index: number) => {
        setSelectedHistoryItem({ item, index });
        setDeleteDialogOpen(true);
    };

    const confirmDeleteHistory = async () => {
        if (!selectedHistoryItem || !entry) return;

        const db = getDatabase(app);
        const updatedHistory = [...(entry.locationHistory || [])];
        updatedHistory.splice(selectedHistoryItem.index, 1);

        const entryRef = ref(db, `entries/${entry.id}`);
        await update(entryRef, { locationHistory: updatedHistory });

        toast({
            title: 'History Entry Deleted',
            description: 'The history entry has been removed.',
            variant: 'destructive',
        });
        setDeleteDialogOpen(false);
        setSelectedHistoryItem(null);
    };

    const confirmDeleteSelectedHistory = async (selectedIndices: number[]) => {
        if (!entry || selectedIndices.length === 0) return;

        const db = getDatabase(app);
        const entryRef = ref(db, `entries/${entry.id}`);
        
        const selectedSet = new Set(selectedIndices);
        const updatedHistory = (entry.locationHistory || []).filter((h, index) => !selectedSet.has(index));

        await update(entryRef, { locationHistory: updatedHistory });

        toast({
            title: 'Records Deleted',
            description: `Successfully deleted ${selectedIndices.length} history records.`,
            variant: 'destructive'
        });
    }

    
    const handleFilterChange = (filterName: keyof Filters, value: string) => {
        setFilters(prev => ({...prev, [filterName]: value}));
    }
    
    const clearFilters = () => {
        setFilters({ signed: 'any', sealed: 'any', hasContent: 'any' });
    }

    return (
        <>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{entry.fileNo}</CardTitle>
                        <CardDescription>{entry.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div><strong className="font-semibold text-muted-foreground">File Type:</strong> {entry.fileType}</div>
                            <div><strong className="font-semibold text-muted-foreground">Company:</strong> {entry.company}</div>
                            <div><strong className="font-semibold text-muted-foreground">Owner:</strong> {entry.owner}</div>
                            <div><strong className="font-semibold text-muted-foreground">Date Created:</strong> {new Date(entry.dateCreated).toLocaleDateString()}</div>
                            <div><strong className="font-semibold text-muted-foreground">Status:</strong> <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge></div>
                            <div className="col-span-2 md:col-span-3"><strong className="font-semibold text-muted-foreground">Current Location:</strong> {`Room ${entry.roomNo}, Rack ${entry.rackNo}, Shelf ${entry.shelfNo}, Box/Folder ${entry.boxNo}`}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <CardTitle>File History</CardTitle>
                                <CardDescription>A complete log of all actions taken on this file.</CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={importInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />
                                    <Button onClick={handleImportClick} variant="outline" size="sm" disabled={entry.status === 'Closed'}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import
                                    </Button>
                                    <Button onClick={handleDownloadExcel} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                    <DeleteHistoryDialog entry={entry} onConfirm={confirmDeleteSelectedHistory} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search history..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Filters</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                    Set filters for the file history.
                                                    </p>
                                                </div>
                                                <Separator />
                                                <div className="grid gap-2">
                                                     <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label>Signed</Label>
                                                        <Select value={filters.signed} onValueChange={(val) => handleFilterChange('signed', val)}>
                                                            <SelectTrigger className="col-span-2 h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">Any</SelectItem>
                                                                <SelectItem value="yes">Yes</SelectItem>
                                                                <SelectItem value="no">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                     <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label>Sealed</Label>
                                                        <Select value={filters.sealed} onValueChange={(val) => handleFilterChange('sealed', val)}>
                                                            <SelectTrigger className="col-span-2 h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">Any</SelectItem>
                                                                <SelectItem value="yes">Yes</SelectItem>
                                                                <SelectItem value="no">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                        <Label>Content</Label>
                                                        <Select value={filters.hasContent} onValueChange={(val) => handleFilterChange('hasContent', val)}>
                                                            <SelectTrigger className="col-span-2 h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">Any</SelectItem>
                                                                <SelectItem value="yes">Doc Adds Only</SelectItem>
                                                                <SelectItem value="no">Updates Only</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    <X className="mr-2 h-4 w-4" /> Clear Filters
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                    <div className="h-full w-full overflow-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Doc Position</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Updated By</TableHead>
                                <TableHead>Signed</TableHead>
                                <TableHead>Sealed</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredHistory.map((item, index) => {
                                const { docPosition, docNumber, remainingNotes } = getDocInfo(item.notes);
                                return (
                                <TableRow key={index}>
                                    <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
                                    <TableCell>
                                    <Badge variant={getStatusVariant(item.status)}>
                                        {item.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell>{docPosition}</TableCell>
                                    <TableCell>{docNumber}</TableCell>
                                    <TableCell>{item.updatedBy}</TableCell>
                                    <TableCell><YesNoBadge value={item.isSigned} /></TableCell>
                                    <TableCell><YesNoBadge value={item.isSealed} /></TableCell>
                                    <TableCell>{remainingNotes}</TableCell>
                                    <TableCell className="text-right">
                                        {item.notes?.startsWith('Added Doc:') && entry.status !== 'Closed' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditHistory(item, item.originalIndex)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteHistory(item, item.originalIndex)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                                )
                            })}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {entry && (
                 <ImportVerificationDialog 
                    isOpen={isImporting}
                    setIsOpen={setIsImporting}
                    targetFile={entry}
                    fileData={importData}
                 />
            )}

            {selectedHistoryItem && entry && (
                <EditHistoryDialog 
                    isOpen={isEditDialogOpen}
                    setIsOpen={setEditDialogOpen}
                    entry={entry}
                    historyItem={selectedHistoryItem.item}
                    historyIndex={selectedHistoryItem.index}
                />
            )}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this history entry. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteHistory}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
