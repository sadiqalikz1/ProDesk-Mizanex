
'use client'
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Entry, LocationHistory } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

type RawRow = { [key: string]: any };
type MappedRow = {
    docNumber?: string;
    docPosition?: string;
    notes?: string;
    date?: string;
    updatedBy?: string;
    isSigned?: boolean;
    isSealed?: boolean;
    status?: string;
    __originalIndex: number;
    __validation: {
        isValid: boolean;
        errors: {
            docNumber?: string;
            docPosition?: string;
        }
    }
};

const REQUIRED_FIELDS = ['docNumber', 'docPosition'];
const ALL_FIELDS = ['docNumber', 'docPosition', 'notes', 'date', 'updatedBy', 'isSigned', 'isSealed', 'status'];

export default function ImportVerificationClient() {
    const [targetFile, setTargetFile] = useState<Entry | null>(null);
    const [allEntries, setAllEntries] = useState<Entry[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<RawRow[]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const storedData = sessionStorage.getItem('importData');
        if (storedData) {
            const { fileData, targetFileId } = JSON.parse(storedData);
            
            const db = getDatabase(app);
            const targetFileRef = ref(db, `entries/${targetFileId}`);
            const allEntriesRef = ref(db, 'entries');

            onValue(targetFileRef, (snapshot) => setTargetFile({ id: snapshot.key!, ...snapshot.val() }));
            onValue(allEntriesRef, (snapshot) => {
                 const entries: Entry[] = [];
                snapshot.forEach((child) => {
                    entries.push({ id: child.key!, ...child.val() });
                });
                setAllEntries(entries);
            });

            const workbook = XLSX.read(fileData, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: RawRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
                const headerRow = jsonData[0] as string[];
                setHeaders(headerRow);
                setRows(jsonData.slice(1).map(row => 
                    headerRow.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {})
                ));
            }
        }
    }, []);

    const handleMappingChange = (header: string, field: string) => {
        setColumnMapping(prev => ({...prev, [header]: field}));
    };

    const mappedAndValidatedRows: MappedRow[] = useMemo(() => {
        if (!targetFile) return [];
        const filesWithSameType = allEntries.filter(e => e.fileType === targetFile.fileType);

        return rows.map((row, index) => {
            const mappedRow: Partial<MappedRow> & { __originalIndex: number } = { __originalIndex: index };
            let validation = { isValid: true, errors: {} };

            for (const header of headers) {
                const mappedField = columnMapping[header];
                if (mappedField && row[header] !== undefined) {
                    let value: any = row[header];
                    if (mappedField === 'isSigned' || mappedField === 'isSealed') {
                        value = ['yes', 'true', '1'].includes(String(value).toLowerCase());
                    }
                     if (mappedField === 'date' && value instanceof Date) {
                        value = value.toISOString();
                    }
                    (mappedRow as any)[mappedField] = value;
                }
            }
            
            // Validation
            const { docNumber, docPosition } = mappedRow;
            // 1. Duplicate docNumber in entire file type
            if (docNumber) {
                for (const file of filesWithSameType) {
                    const duplicate = (file.locationHistory || []).find(h => h.notes?.includes(`#${docNumber} `));
                    if (duplicate) {
                        validation.isValid = false;
                        (validation.errors as any).docNumber = `Exists in file ${file.fileNo}`;
                        break;
                    }
                }
            }
            // 2. Duplicate docPosition in target file
            if (docPosition) {
                const duplicate = (targetFile.locationHistory || []).find(h => h.notes?.includes(`(Pos: ${docPosition})`));
                if (duplicate) {
                    validation.isValid = false;
                    (validation.errors as any).docPosition = `Position already exists`;
                }
            }

            return { ...mappedRow, __validation: validation } as MappedRow;
        });
    }, [columnMapping, rows, headers, targetFile, allEntries]);

    const handleConfirmImport = async () => {
        if (!targetFile) return;

        const hasUnmappedRequiredFields = REQUIRED_FIELDS.some(field => !Object.values(columnMapping).includes(field));
        if (hasUnmappedRequiredFields) {
            toast({ title: 'Mapping Incomplete', description: 'Please map all required fields: Document # and Doc Position.', variant: 'destructive'});
            return;
        }

        const hasInvalidRows = mappedAndValidatedRows.some(row => !row.__validation.isValid);
        if (hasInvalidRows) {
            toast({ title: 'Validation Failed', description: 'Please fix all errors before importing.', variant: 'destructive'});
            return;
        }

        setIsProcessing(true);
        const newHistoryItems: LocationHistory[] = mappedAndValidatedRows.map(row => {
            let constructedNotes = 'Added Doc: ';
            if (row.docNumber) constructedNotes += `#${row.docNumber} `;
            if (row.docPosition) constructedNotes += `(Pos: ${row.docPosition}) `;
            if (row.notes) constructedNotes += `- ${row.notes}`;
            
            return {
                date: row.date || new Date().toISOString(),
                location: targetFile.locationHistory?.slice(-1)[0]?.location || 'N/A',
                status: row.status || targetFile.status,
                updatedBy: row.updatedBy || 'Import',
                notes: constructedNotes,
                isSigned: row.isSigned,
                isSealed: row.isSealed,
            };
        });

        const entryRef = ref(getDatabase(app), `entries/${targetFile.id}`);
        const updatedHistory = [...(targetFile.locationHistory || []), ...newHistoryItems];

        try {
            await update(entryRef, { locationHistory: updatedHistory });
            toast({
                title: 'Import Successful!',
                description: `Added ${newHistoryItems.length} records to file ${targetFile.fileNo}. You can close this tab.`,
            });
            setTimeout(() => window.close(), 3000);
        } catch (error) {
            toast({ title: 'Import Failed', description: 'An error occurred while saving the data.', variant: 'destructive' });
            setIsProcessing(false);
        }
    };
    
    if (!targetFile) return <p>Loading...</p>

    return (
        <Card className="w-full max-w-7xl mx-auto">
            <CardHeader>
                <CardTitle>Import Verification</CardTitle>
                <CardDescription>
                    Verify and map data before importing to file: <span className="font-bold text-primary">{targetFile.fileNo}</span>.
                    Please map your spreadsheet columns to the required application fields.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(header => (
                                    <TableHead key={header}>
                                        <p className='font-bold text-foreground'>{header}</p>
                                        <Select onValueChange={(value) => handleMappingChange(header, value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Map to..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unmapped">(Unmapped)</SelectItem>
                                                {ALL_FIELDS.map(field => (
                                                    <SelectItem key={field} value={field}>
                                                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mappedAndValidatedRows.slice(0, 10).map((row, index) => (
                                <TableRow key={index}>
                                    {headers.map(header => {
                                        const mappedField = columnMapping[header];
                                        const error = mappedField ? row.__validation.errors[mappedField as keyof typeof row.__validation.errors] : undefined;
                                        return (
                                            <TableCell key={header} className={cn(error && 'bg-destructive/10')}>
                                                {String(rows[row.__originalIndex][header] ?? '')}
                                                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {rows.length > 10 && <p className="text-sm text-center text-muted-foreground">Showing first 10 of {rows.length} rows.</p>}
                
                <div className="flex justify-between items-start p-4 bg-muted/50 rounded-lg">
                    <div>
                        <h3 className="font-bold">Validation Summary</h3>
                        {mappedAndValidatedRows.every(r => r.__validation.isValid) ? (
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle className="h-4 w-4" />
                                <p>All rows are valid and ready for import.</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-destructive mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <p>{mappedAndValidatedRows.filter(r => !r.__validation.isValid).length} row(s) have errors. Please fix them before importing.</p>
                            </div>
                        )}
                         <div className="flex items-center gap-2 text-primary mt-2">
                                <Badge variant={REQUIRED_FIELDS.every(f => Object.values(columnMapping).includes(f)) ? 'default' : 'destructive'}>
                                {REQUIRED_FIELDS.every(f => Object.values(columnMapping).includes(f)) ? 'Required Fields Mapped' : 'Missing Required Mappings'}
                                </Badge>
                        </div>

                    </div>
                    <Button onClick={handleConfirmImport} disabled={isProcessing || mappedAndValidatedRows.some(r => !r.__validation.isValid) || REQUIRED_FIELDS.some(f => !Object.values(columnMapping).includes(f))}>
                        {isProcessing ? 'Importing...' : 'Confirm Import'}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
