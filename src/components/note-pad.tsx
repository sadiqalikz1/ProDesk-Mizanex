'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function NotePad() {
  const [note, setNote] = useState('Quick memo: Follow up with the design team about the new branding guidelines. Also, prepare agenda for the Wednesday sync-up.');
  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, this would save to a DB or local storage
    console.log('Note saved:', note);
    toast({
      title: 'Note Saved',
      description: 'Your note has been successfully saved.',
    });
  };

  return (
    <Card className="sm:col-span-2">
      <CardHeader>
        <CardTitle>Note Pad</CardTitle>
        <CardDescription>A digital scratchpad for quick notes.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Jot down your thoughts..."
          className="h-32 resize-none"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save Note
        </Button>
      </CardFooter>
    </Card>
  );
}
