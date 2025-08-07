
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddEntryDialog } from './add-entry-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export function CreateFile() {
  const [isAddEntryDialogOpen, setAddEntryDialogOpen] = useState(false);

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
    </Card>

      <AddEntryDialog
        isOpen={isAddEntryDialogOpen}
        setIsOpen={setAddEntryDialogOpen}
      />
    </>
  );
}
