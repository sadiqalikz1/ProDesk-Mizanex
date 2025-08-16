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
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useFileTracker } from '@/context/file-tracker-context';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

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
    __rawData: RawRow;
    __validation: {
        isValid: boolean;
        errors: {
            [key: string]: string | undefined;
        }
    }
};

const REQUIRED_FIELDS = ['docNumber', 'docPosition'];
const ALL_FIELDS = ['docNumber', 'docPosition', 'notes', 'date', 'updatedBy', 'isSigned', 'isSealed', 'status'];

export function ImportVerificationDialog({
    isOpen,
    setIsOpen,
    targetFile,
    fileData,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    targetFile: Entry;
    fileData: any;
}) {
    const { allEntries } = useFileTracker();
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const [processedRows, setProcessedRows] = useState<MappedRow[]>([]);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const validateRow = (row: MappedRow, allMappedRows: MappedRow[], filesWithSameType: Entry[]): { isValid: boolean; errors: { [key: string]: string | undefined } } => {
        let validation = { isValid: true, errors: {} as any };
        const { docNumber, docPosition } = row;

        if (docNumber) {
            for (const file of filesWithSameType) {
                const duplicate = (file.locationHistory || []).find(h => h.notes?.includes(`#${docNumber} `));
                if (duplicate) {
                    validation.isValid = false;
                    validation.errors.docNumber = `Exists in file ${file.fileNo}`;
                    break;
                }
            }
             // Check for duplicates within the current import batch, ignoring self
            const duplicateInBatch = allMappedRows.find(r => r.__rawData !== row.__rawData && r.docNumber === docNumber);
            if (duplicateInBatch) {
                validation.isValid = false;
                validation.errors.docNumber = `Duplicate in this import`;
            }
        }

        if (docPosition) {
            const duplicate = (targetFile.locationHistory || []).find(h => h.notes?.includes(`(Pos: ${docPosition})`));
            if (duplicate) {
                validation.isValid = false;
                validation.errors.docPosition = `Position already exists`;
            }
            // Check for duplicates within the current import batch, ignoring self
            const duplicateInBatch = allMappedRows.find(r => r.__rawData !== row.__rawData && r.docPosition === docPosition);
             if (duplicateInBatch) {
                validation.isValid = false;
                validation.errors.docPosition = `Duplicate in this import`;
            }
        }
        
        return validation;
    };
    
    const processAndValidateRows = (rows: RawRow[], currentMapping: { [key: string]: string }) => {
        if (!targetFile) return [];
        const filesWithSameType = allEntries.filter(e => e.fileType === targetFile.fileType);

        const mappedRows: MappedRow[] = rows.map((row, index) => {
            const mappedRow: Partial<MappedRow> & { __rawData: RawRow } = { __rawData: row };
            for (const header of headers) {
                const mappedField = currentMapping[header];
                if (mappedField && row[header] !== undefined) {
                    let value: any = row[header];
                    if (mappedField === 'isSigned' || mappedField === 'isSealed') {
                        (mappedRow as any)[mappedField] = ['yes', 'true', '1'].includes(String(value).toLowerCase());
                    } else {
                         if (mappedField === 'date' && value instanceof Date) {
                            value = value.toISOString();
                        }
                        (mappedRow as any)[mappedField] = String(value);
                    }
                }
            }
            return mappedRow as MappedRow;
        });

        return mappedRows.map(row => {
            const validation = validateRow(row, mappedRows, filesWithSameType);
            return { ...row, __validation: validation };
        })
    };


    useEffect(() => {
        if (isOpen && fileData) {
            try {
                const workbook = XLSX.read(fileData, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: RawRow[] = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length > 0) {
                    setHeaders(Object.keys(jsonData[0]));
                    setProcessedRows(processAndValidateRows(jsonData, columnMapping));
                }
            } catch(e) {
                toast({ title: 'Error reading file', description: 'Could not parse the selected file.', variant: 'destructive'});
                setIsOpen(false);
            }
        }
    }, [isOpen, fileData, toast, setIsOpen]);

    useEffect(() => {
        if (processedRows.length > 0) {
            setProcessedRows(currentRows => processAndValidateRows(currentRows.map(r => r.__rawData), columnMapping));
        }
    }, [columnMapping, targetFile, allEntries]);

    const handleMappingChange = (header: string, field: string) => {
        setColumnMapping(prev => ({...prev, [header]: field}));
    };

    const handleCellChange = (rowIndex: number, fieldName: keyof MappedRow, value: string) => {
        setProcessedRows(currentRows => {
            const newRows = [...currentRows];
            const rowToUpdate = { ...newRows[rowIndex], [fieldName]: value };
            newRows[rowIndex] = rowToUpdate;

            const filesWithSameType = allEntries.filter(e => e.fileType === targetFile.fileType);
            
            // We need to re-validate the entire set in case this change resolves a duplicate issue for another row
            return newRows.map((r) => {
                 const newValidation = validateRow(r, newRows, filesWithSameType);
                 return {...r, __validation: newValidation};
            });
        });
    };
    
    const handleToggleRow = (rowIndex: number) => {
        setSelectedRows(prev => 
            prev.includes(rowIndex) 
                ? prev.filter(i => i !== rowIndex)
                : [...prev, rowIndex]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedRows.length === processedRows.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(processedRows.map((_, index) => index));
        }
    };

    const handleDeleteSelectedRows = () => {
        const newProcessedRows = processedRows.filter((_, index) => !selectedRows.includes(index));
        setProcessedRows(newProcessedRows);

        const newSelectedRows = selectedRows.map(selectedIndex => {
            return newProcessedRows.findIndex(row => row.__rawData === processedRows[selectedIndex].__rawData);
        }).filter(index => index !== -1);
        
        setSelectedRows([]);

        toast({
            title: "Rows Deleted",
            description: `${selectedRows.length} rows have been removed from this import.`,
            variant: "destructive"
        })
    };


    const handleConfirmImport = async () => {
        if (!targetFile) return;

        const hasUnmappedRequiredFields = REQUIRED_FIELDS.some(field => !Object.values(columnMapping).includes(field));
        if (hasUnmappedRequiredFields) {
            toast({ title: 'Mapping Incomplete', description: 'Please map all required fields: Document # and Doc Position.', variant: 'destructive'});
            return;
        }

        const hasInvalidRows = processedRows.some(row => !row.__validation.isValid);
        if (hasInvalidRows) {
            toast({ title: 'Validation Failed', description: 'Please fix all errors before importing.', variant: 'destructive'});
            return;
        }

        const rowsToImport = processedRows.filter(row => row.__validation.isValid);
        if (rowsToImport.length === 0) {
            toast({ title: 'No Valid Rows', description: 'There are no valid rows to import.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        const newHistoryItems: LocationHistory[] = rowsToImport.map(row => {
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
            setIsProcessing(false);
            setIsOpen(false);
        } catch (error) {
            toast({ title: 'Import Failed', description: 'An error occurred while saving the data.', variant: 'destructive' });
            setIsProcessing(false);
        }
    };
    
    const totalRows = processedRows.length;
    const errorRowsCount = processedRows.filter(r => !r.__validation.isValid).length;
    const isReadyForImport = !errorRowsCount && !REQUIRED_FIELDS.some(f => !Object.values(columnMapping).includes(f));
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Verification</DialogTitle>
                    <DialogDescription>
                        Verify and map data before importing to file: <span className="font-bold text-primary">{targetFile.fileNo}</span>.
                        Please map your spreadsheet columns to the required application fields.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox 
                                        checked={processedRows.length > 0 && selectedRows.length === processedRows.length}
                                        onCheckedChange={handleToggleSelectAll}
                                        aria-label="Select all rows"
                                    />
                                </TableHead>
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
                            {processedRows.map((row, rowIndex) => (
                                <TableRow key={rowIndex} data-state={selectedRows.includes(rowIndex) ? "selected" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(rowIndex)}
                                            onCheckedChange={() => handleToggleRow(rowIndex)}
                                            aria-label={`Select row ${rowIndex + 1}`}
                                        />
                                    </TableCell>
                                    {headers.map(header => {
                                        const mappedField = columnMapping[header] as keyof MappedRow | undefined;
                                        const error = mappedField ? row.__validation.errors[mappedField] : undefined;
                                        const originalValue = String(row.__rawData[header] ?? '');
                                        let currentValue = mappedField ? row[mappedField] : originalValue;

                                        // For boolean fields, display Yes/No but edit as a string from the original data if needed.
                                        if (mappedField === 'isSigned' || mappedField === 'isSealed') {
                                            currentValue = currentValue ? 'Yes' : 'No';
                                        }
                                        
                                        const displayValue = mappedField ? (currentValue ?? '') : originalValue;

                                        if (error) {
                                            return (
                                                 <TableCell key={header} className="bg-destructive/10">
                                                    <Input 
                                                        defaultValue={originalValue}
                                                        onChange={(e) => handleCellChange(rowIndex, mappedField!, e.target.value)}
                                                        className="border-destructive"
                                                    />
                                                    <p className="text-xs text-destructive mt-1">{error}</p>
                                                </TableCell>
                                            )
                                        }

                                        return (
                                            <TableCell key={header}>
                                                {String(displayValue ?? '')}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                <DialogFooter className="!justify-between items-start p-4 bg-muted/50 rounded-lg">
                    <div>
                        <h3 className="font-bold">Validation Summary</h3>
                        {errorRowsCount === 0 ? (
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle className="h-4 w-4" />
                                <p>All rows are valid and ready for import.</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-destructive mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <p>{errorRowsCount} row(s) have errors. Please edit them in the table above.</p>
                            </div>
                        )}
                         <div className="flex items-center gap-2 text-primary mt-2">
                                <Badge variant={REQUIRED_FIELDS.every(f => Object.values(columnMapping).includes(f)) ? 'default' : 'destructive'}>
                                {REQUIRED_FIELDS.every(f => Object.values(columnMapping).includes(f)) ? 'Required Fields Mapped' : 'Missing Required Mappings'}
                                </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelectedRows}
                            disabled={selectedRows.length === 0}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedRows.length})
                        </Button>
                        <Button onClick={handleConfirmImport} disabled={isProcessing || !isReadyForImport}>
                            {isProcessing ? 'Importing...' : `Import ${totalRows - errorRowsCount} Valid Rows`}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
