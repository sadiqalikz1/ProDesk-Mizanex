
'use client'

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { app } from "@/lib/firebase";
import * as XLSX from 'xlsx';
import { Entry, LocationHistory } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Download, Upload, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditHistoryEntryDialog } from "./edit-history-entry-dialog";
import { DeleteHistoryEntryDialog } from "./delete-history-entry-dialog";
import { Input } from "../ui/input";


export default function FileDetails() {
    const searchParams = useSearchParams();
    const fileId = searchParams.get('id');
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);
    const [isDeleteHistoryOpen, setIsDeleteHistoryOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<{item: LocationHistory, index: number} | null>(null);
    const [searchTerm, setSearchTerm] = useState('');


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
          case 'Created':
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
                
                // Store data in session storage to pass to the new tab
                sessionStorage.setItem('importData', JSON.stringify({
                    fileData: data,
                    targetFileId: entry.id,
                }));
                
                // Open new tab for verification
                window.open('/import-verification', '_blank');

            } catch (error) {
                console.error("Import error:", error);
                toast({
                    title: 'Import Failed',
                    description: 'There was an error processing the file.',
                    variant: 'destructive',
                });
            } finally {
                // Reset file input
                if(importInputRef.current) {
                    importInputRef.current.value = '';
                }
            }
        };

        reader.readAsBinaryString(file);
    };
    
    const handleEditHistory = (item: LocationHistory, index: number) => {
        const originalIndex = (entry?.locationHistory || []).indexOf(item);
        setSelectedHistory({ item, index: originalIndex });
        setIsEditHistoryOpen(true);
    };

    const handleDeleteHistory = (item: LocationHistory, index: number) => {
        const originalIndex = (entry?.locationHistory || []).indexOf(item);
        setSelectedHistory({ item, index: originalIndex });
        setIsDeleteHistoryOpen(true);
    }
    
    const documentHistory = useMemo(() => {
        if (!entry?.locationHistory) return [];
        return [...(entry.locationHistory || [])]
            .filter(item => item.status !== 'Created')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [entry]);

    const filteredDocumentHistory = useMemo(() => {
        if (!searchTerm) return documentHistory;

        const lowercasedTerm = searchTerm.toLowerCase();
        return documentHistory.filter(item => {
            const { docNumber, docPosition, remainingNotes } = getDocInfo(item.notes);
            return (
                item.status?.toLowerCase().includes(lowercasedTerm) ||
                docPosition.toLowerCase().includes(lowercasedTerm) ||
                docNumber.toLowerCase().includes(lowercasedTerm) ||
                item.updatedBy?.toLowerCase().includes(lowercasedTerm) ||
                remainingNotes.toLowerCase().includes(lowercasedTerm)
            );
        });
    }, [searchTerm, documentHistory]);

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

    const handleDownloadExcel = () => {
        const dataToExport = documentHistory.map(item => {
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Document History");

        XLSX.writeFile(workbook, `${entry.fileNo}_document_history.xlsx`);
    }

    const YesNoBadge = ({value}: {value: boolean | undefined}) => (
        <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>
    )

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
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Document History</CardTitle>
                            <CardDescription>A log of all documents added to this file.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <input type="file" ref={importInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />
                            <Button onClick={handleImportClick} variant="outline" size="sm">
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </Button>
                            <Button onClick={handleDownloadExcel} variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                    <div className="w-full overflow-x-auto">
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
                            {filteredDocumentHistory.map((item, index) => {
                                const { docPosition, docNumber, remainingNotes } = getDocInfo(item.notes);
                                const originalIndex = (entry.locationHistory || []).indexOf(item);
                                return (
                                <TableRow key={`${item.date}-${index}`}>
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
                                        <Button variant="ghost" size="icon" onClick={() => handleEditHistory(item, originalIndex)}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteHistory(item, originalIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
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
            {entry && selectedHistory && (
                <EditHistoryEntryDialog 
                    isOpen={isEditHistoryOpen}
                    setIsOpen={setIsEditHistoryOpen}
                    entry={entry}
                    historyEntry={selectedHistory.item}
                    historyIndex={selectedHistory.index}
                />
            )}
             {entry && selectedHistory && (
                <DeleteHistoryEntryDialog 
                    isOpen={isDeleteHistoryOpen}
                    setIsOpen={setIsDeleteHistoryOpen}
                    entry={entry}
                    historyEntry={selectedHistory.item}
                    historyIndex={selectedHistory.index}
                />
            )}
        </>
    )
}
