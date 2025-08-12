
'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "@/lib/firebase";
import * as XLSX from 'xlsx';
import { Entry, LocationHistory } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Download, Stamp, Pencil, Check } from "lucide-react";
import { QuickActionDialog } from "./quick-action-dialog";

export default function FileDetails() {
    const searchParams = useSearchParams();
    const fileId = searchParams.get('id');
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approve' | 'Seal' | 'Sign' | null>(null);

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

    const handleQuickAction = (type: 'Approve' | 'Seal' | 'Sign') => {
        setActionType(type);
        setIsActionDialogOpen(true);
    }

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

    const sortedHistory = [...(entry.locationHistory || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDownloadExcel = () => {
        const dataToExport = sortedHistory.map(item => {
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

        XLSX.writeFile(workbook, `${entry.fileNo}_history.xlsx`);
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>File History</CardTitle>
                            <CardDescription>A complete log of all actions taken on this file.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={() => handleQuickAction('Approve')} variant="outline" size="sm">
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                             <Button onClick={() => handleQuickAction('Seal')} variant="outline" size="sm">
                                <Stamp className="mr-2 h-4 w-4" />
                                Seal
                            </Button>
                             <Button onClick={() => handleQuickAction('Sign')} variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Sign
                            </Button>
                            <Button onClick={handleDownloadExcel} variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download as Excel
                            </Button>
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
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedHistory.map((item, index) => {
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
                                </TableRow>
                                )
                            })}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
             {entry && actionType && (
                <QuickActionDialog
                    isOpen={isActionDialogOpen}
                    setIsOpen={setIsActionDialogOpen}
                    entry={entry}
                    actionType={actionType}
                />
            )}
        </>
    )
}
