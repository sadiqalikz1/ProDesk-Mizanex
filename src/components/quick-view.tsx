import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, BarChart2, Presentation } from 'lucide-react';

const recentDocuments = [
  { name: 'Q3_Financial_Report.docx', type: 'doc', lastModified: '2 hours ago', icon: FileText },
  { name: 'Marketing_Analytics_Dashboard.xlsx', type: 'sheet', lastModified: 'Yesterday', icon: BarChart2 },
  { name: 'New_Product_Launch_Plan.pptx', type: 'slide', lastModified: '3 days ago', icon: Presentation },
  { name: 'Project_Alpha_Brief.docx', type: 'doc', lastModified: 'Last week', icon: FileText },
];

export default function QuickView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick View</CardTitle>
        <CardDescription>Access your recent documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 pr-4">
          <ul className="space-y-4">
            {recentDocuments.map((doc) => (
              <li key={doc.name} className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <doc.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.lastModified}</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
