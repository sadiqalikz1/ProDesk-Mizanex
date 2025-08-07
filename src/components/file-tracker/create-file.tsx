
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddEntryDialog } from './add-entry-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function CreateFile() {
  const [isAddEntryDialogOpen, setAddEntryDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
            <div className='flex justify-between items-center'>
                <CardTitle>Create New File</CardTitle>
                <Button onClick={() => setAddEntryDialogOpen(true)}>
                    Create New File
                </Button>
            </div>
            <CardDescription>
                Start a new physical file record.
            </CardDescription>
        </CardHeader>
      </Card>

      <AddEntryDialog
        isOpen={isAddEntryDialogOpen}
        setIsOpen={setAddEntryDialogOpen}
      />
    </>
  );
}
