'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BriefcaseBusiness,
  Home,
  Users,
  Settings,
  PanelLeft,
  ExternalLink,
  Mail,
  Calendar,
  Database,
} from 'lucide-react';
import { Button } from './ui/button';

const appLinks = [
  { name: 'Google Mail', icon: Mail, href: 'https://mail.google.com' },
  {
    name: 'Google Calendar',
    icon: Calendar,
    href: 'https://calendar.google.com',
  },
  { name: 'Microsoft 365', icon: Database, href: 'https://www.office.com' },
];

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
              ProDesk
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleSidebar()}
          >
            <PanelLeft />
            <span className="sr-only">Collapse</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive tooltip="Dashboard">
              <Home />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="External Apps">
                  <ExternalLink />
                  <span>External Apps</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {appLinks.map((link) => (
                  <DropdownMenuItem key={link.name} asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Team Workspace">
              <Users />
              <span>Team Workspace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
