'use client';

import { useState } from 'react';
import { getDatabase, ref, remove } from 'firebase/database';
import { app } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Paintbrush, RotateCcw, Trash2, DatabaseZap } from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [dataToClear, setDataToClear] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your new settings have been applied.',
    });
  };

  const handleReset = () => {
    setTheme('system');
    toast({
      title: 'Settings Reset',
      description: 'Your settings have been reset to their default values.',
    });
  };

  const handleClearData = async () => {
    if (!dataToClear) {
      toast({
        title: 'No Data Selected',
        description: 'Please select a data category to clear.',
        variant: 'destructive',
      });
      return;
    }

    const db = getDatabase(app);
    let success = false;
    
    if (dataToClear === 'file-tracker') {
      try {
<<<<<<< HEAD
        const pathsToClear = [
          'entries', 'companies', 'docTypes', 'rooms', 
          'racks', 'shelves', 'shelvesMetadata'
        ];
        
        const promises = pathsToClear.map(path => remove(ref(db, path)));
        await Promise.all(promises);
=======
        const entriesRef = ref(db, 'entries');
        const companiesRef = ref(db, 'companies');
        const docTypesRef = ref(db, 'docTypes');
        
        await remove(entriesRef);
        await remove(companiesRef);
        await remove(docTypesRef);
>>>>>>> VIRTUALLOCTION
        
        success = true;
      } catch (error) {
        console.error("Failed to clear File Tracker data:", error);
      }
    }

    if (success) {
      toast({
        title: 'Data Cleared',
        description: `Successfully cleared all ${dataToClear.replace('-', ' ')} data.`,
      });
    } else {
       toast({
        title: 'Error',
        description: `Failed to clear ${dataToClear.replace('-', ' ')} data.`,
        variant: 'destructive',
      });
    }

    setDataToClear('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button onClick={handleSave}>
            <Paintbrush className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Permanently delete data from the application. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data-clear">Select Data to Clear</Label>
              <Select value={dataToClear} onValueChange={setDataToClear}>
                <SelectTrigger id="data-clear">
                  <SelectValue placeholder="Select data..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file-tracker">File Tracker Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!dataToClear}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Selected Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible and will permanently delete all {' '}
                  <span className='font-bold'>{dataToClear.replace('-', ' ')} data</span>.
                  Please confirm you want to proceed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Preferences</CardTitle>
          <CardDescription>
            This will reset all your custom settings to their default values. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently reset all your application settings. You cannot undo this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
