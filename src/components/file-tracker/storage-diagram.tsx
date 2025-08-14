
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Entry, Shelf, Rack } from './types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Building, Library, File as FileIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Link from 'next/link';
import { useFileTracker } from '@/context/file-tracker-context';

export default function StorageDiagram() {
  const { entries, racks, loading } = useFileTracker();

  const organizedData = useMemo(() => {
    const data: { [room: string]: Rack[] } = {};
    racks.forEach((rack) => {
      if (!data[rack.roomNo]) {
        data[rack.roomNo] = [];
      }
      data[rack.roomNo].push(rack);
    });
     const sortedRooms = Object.keys(data).sort();
     const finalData: { [room: string]: Rack[] } = {};
     sortedRooms.forEach((room) => {
       finalData[room] = data[room].sort((a, b) =>
         a.rackNo.localeCompare(b.rackNo)
       );
     });
    return finalData;
  }, [racks]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Storage': return 'default';
      case 'Checked Out': return 'secondary';
      case 'In Use': return 'destructive';
      case 'Closed': return 'outline';
      default: return 'default';
    }
  };

  const ShelfContent = ({ shelf }: { shelf: Shelf }) => {
    const filesOnShelf = useMemo(() => entries.filter(e => e.roomNo === shelf.roomNo && e.rackNo === shelf.rackNo && e.shelfNo === shelf.shelfNo), [shelf, entries]);

    const filesByPosition: {[key: string]: Entry} = {};
    filesOnShelf.forEach(f => {
      if(f.boxNo) filesByPosition[f.boxNo] = f;
    })

    return (
      <div className='p-2 bg-muted/20 rounded-lg'>
        <h4 className='font-bold mb-2 text-center'>Shelf {shelf.shelfNo} (Capacity: {shelf.capacity})</h4>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: shelf.capacity }, (_, i) => {
            const pos = i + 1;
            const file = filesByPosition[pos];
            
            const fileCell = (
              <div className={cn(
                "flex flex-col items-center justify-center h-20 rounded-md border-2 text-xs p-1 text-center",
                file ? "border-primary bg-primary/10" : "border-dashed"
              )}>
                {file ? (
                  <>
                    <FileIcon className='h-4 w-4 mb-1' />
                    <span className='font-bold truncate w-full'>{file.fileNo}</span>
                    <Badge variant={getStatusVariant(file.status)} className='mt-1'>{file.status}</Badge>
                  </>
                ) : (
                  <span className='text-muted-foreground'>Empty</span>
                )}
              </div>
            );
            
            return (
              <TooltipProvider key={pos} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {file ? <Link href={`/file-page?id=${file.id}`}>{fileCell}</Link> : <div>{fileCell}</div>}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='font-bold'>Position: {pos}</p>
                    {file ? (
                      <div className='text-sm mt-1'>
                        <p><span className='font-semibold'>File Name:</span> {file.fileNo}</p>
                        <p><span className='font-semibold'>Type:</span> {file.fileType}</p>
                        <p><span className='font-semibold'>Company:</span> {file.company}</p>
                        <p><span className='font-semibold'>Owner:</span> {file.owner}</p>
                        <p><span className='font-semibold'>Status:</span> {file.status}</p>
                      </div>
                    ) : <p>This slot is empty.</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (Object.keys(organizedData).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Storage Layouts Found</CardTitle>
          <CardDescription>
            Go to the "Manage Storage" page to create your first storage layout.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sortedRooms = Object.keys(organizedData).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Diagram</CardTitle>
        <CardDescription>
          A diagrammatic overview of your physical storage layout. Hover over a file to see details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="multiple" defaultValue={sortedRooms} className="w-full space-y-4">
          {sortedRooms.map((room) => (
            <AccordionItem value={room} key={room} className="border rounded-md px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Building className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">Room: {room}</h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 border-t">
                  <div className="space-y-8 p-4 bg-muted/20 rounded-lg">
                      {organizedData[room].map((rack) => (
                        <Card key={rack.id} className="flex flex-col bg-background">
                            <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Library className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{rack.rackNo}</CardTitle>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                  {rack.rows}x{rack.cols} Shelves
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1">
                              <div 
                                  className="grid gap-4"
                                  style={{ gridTemplateColumns: `repeat(${rack.cols}, minmax(0, 1fr))` }}
                                  >
                                  {rack.shelves.map((shelf) => (
                                    <ShelfContent key={shelf.id} shelf={shelf} />
                                  ))}
                              </div>
                            </CardContent>
                        </Card>
                      ))}
                  </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
