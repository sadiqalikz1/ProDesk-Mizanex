import { BriefcaseBusiness } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between p-4 mx-auto max-w-7xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <BriefcaseBusiness className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ProDesk
          </h1>
        </div>
        <Avatar>
          <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
          <AvatarFallback>PD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
