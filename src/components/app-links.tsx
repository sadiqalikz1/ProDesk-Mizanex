import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, Database, Users } from 'lucide-react';

const appLinks = [
  { name: 'Google Mail', icon: Mail, href: 'https://mail.google.com' },
  { name: 'Google Calendar', icon: Calendar, href: 'https://calendar.google.com' },
  { name: 'Microsoft 365', icon: Database, href: 'https://www.office.com' },
  { name: 'Team Workspace', icon: Users, href: '#' },
];

export default function AppLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>App Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {appLinks.map((link) => (
            <Button
              key={link.name}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4 text-center"
              asChild
            >
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <link.icon className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xs font-medium">{link.name}</span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
