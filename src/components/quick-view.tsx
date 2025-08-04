import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart2, FileText, Presentation } from 'lucide-react';

const recentDocuments = [
  {
    name: 'Q3_Financial_Report.docx',
    type: 'doc',
    lastModified: '2 hours ago',
    icon: FileText,
  },
  {
    name: 'Marketing_Analytics_Dashboard.xlsx',
    type: 'sheet',
    lastModified: 'Yesterday',
    icon: BarChart2,
  },
  {
    name: 'New_Product_Launch_Plan.pptx',
    type: 'slide',
    lastModified: '3 days ago',
    icon: Presentation,
  },
  {
    name: 'Project_Alpha_Brief.docx',
    type: 'doc',
    lastModified: 'Last week',
    icon: FileText,
  },
  {
    name: '2024_Budget.xlsx',
    type: 'sheet',
    lastModified: 'Last week',
    icon: BarChart2,
  },
  {
    name: 'Q2_Review.pptx',
    type: 'slide',
    lastModified: '2 weeks ago',
    icon: Presentation,
  },
];

export default function QuickView() {
  return (
    <Card className="grid items-start gap-4">
      <CardHeader>
        <CardTitle>Quick View</CardTitle>
        <CardDescription>Access your recent documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px] text-right">
                Last Modified
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentDocuments.map((doc) => (
              <TableRow key={doc.name}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-lg">
                      <doc.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium whitespace-normal break-words">
                      {doc.name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{doc.lastModified}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
