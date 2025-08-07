
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddEntryDialog } from './add-entry-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export function CreateFile() {
  const [isAddEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleResetData = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db);

    const sampleData = {
        companies: [
            "Solutions Corp.",
            "Innovate LLC",
            "Quantum Industries",
        ],
        docTypes: [
            "Invoice",
            "Contract",
            "Report",
        ],
        entries: {
            "-M1a2b3c4d5e6f7g8": {
                fileNo: "INV-2024-001",
                fileType: "Invoice",
                company: "Solutions Corp.",
                dateCreated: new Date("2024-01-15").toISOString(),
                description: "Invoice for Q1 services.",
                owner: "Alice",
                roomNo: "101",
                rackNo: "A",
                shelfNo: "3",
                boxNo: "12",
                status: "In Storage",
                locationHistory: [
                    {
                        date: new Date().toISOString(),
                        location: "Room: 101, Rack: A, Shelf: 3, Box: 12",
                        status: "Created",
                        updatedBy: "Alice",
                        notes: "File created."
                    }
                ]
            },
            "-M9h8i7j6k5l4m3n2": {
                fileNo: "CTR-2023-05",
                fileType: "Contract",
                company: "Innovate LLC",
                dateCreated: new Date("2023-11-20").toISOString(),
                description: "Service agreement.",
                owner: "Bob",
                roomNo: "102",
                rackNo: "B",
                shelfNo: "1",
                boxNo: "5",
                status: "Checked Out",
                locationHistory: [
                     {
                        date: new Date("2023-11-20").toISOString(),
                        location: "Room: 102, Rack: B, Shelf: 1, Box: 5",
                        status: "Created",
                        updatedBy: "Bob",
                        notes: "File created."
                    },
                    {
                        date: new Date().toISOString(),
                        location: "Room: 102, Rack: B, Shelf: 1, Box: 5",
                        status: "Checked Out",
                        updatedBy: "Charlie",
                        notes: "Checked out for legal review."
                    }
                ]
            }
        }
    };

    try {
        await set(ref(db, 'companies'), sampleData.companies);
        await set(ref(db, 'docTypes'), sampleData.docTypes);
        await set(ref(db, 'entries'), sampleData.entries);

        toast({
            title: 'Data Reset Successful',
            description: 'The database has been cleared and populated with sample data.',
        });
    } catch (error) {
         toast({
            title: 'Error Resetting Data',
            description: 'Could not reset database. Check console for details.',
            variant: 'destructive',
        });
        console.error(error);
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Create New File</CardTitle>
        <CardDescription>Start a new physical file record.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setAddEntryDialogOpen(true)} className='w-full'>
            Create New File
        </Button>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2">
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    Reset Data
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete all current file tracking data and replace it with sample data. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetData}>
                        Yes, reset data
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <p className="text-xs text-center text-muted-foreground">
            Use with caution. Resetting will clear all file records.
        </p>
      </CardFooter>
    </Card>

      <AddEntryDialog
        isOpen={isAddEntryDialogOpen}
        setIsOpen={setAddEntryDialogOpen}
      />
    </>
  );
}
