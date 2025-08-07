
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddEntryDialog } from './add-entry-dialog';

export function CreateFile() {
  const [isAddEntryDialogOpen, setAddEntryDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setAddEntryDialogOpen(true)}>
          Create New File
      </Button>

      <AddEntryDialog
        isOpen={isAddEntryDialogOpen}
        setIsOpen={setAddEntryDialogOpen}
      />
    </>
  );
}
