'use client';
import { useState } from 'react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BriefcaseBusiness,
  Home,
  Mail,
  Calendar,
  Database,
  Users,
  Settings,
  PanelLeft,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();
  const [appsOpen, setAppsOpen] = useState(false);

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
            <SidebarMenuButton
              onClick={() => setAppsOpen(!appsOpen)}
              tooltip="External Apps"
            >
              <ExternalLink />
              <span className="flex-1">External Apps</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transform transition-transform duration-200',
                  appsOpen && 'rotate-180'
                )}
              />
            </SidebarMenuButton>
            {appsOpen && (
              <div className="ml-4 mt-2 flex flex-col gap-1 border-l pl-4 group-data-[collapsible=icon]:hidden">
                <SidebarMenuButton
                  href="https://mail.google.com"
                  target="_blank"
                  tooltip="Google Mail"
                  size="sm"
                  className="h-8"
                >
                  <Mail />
                  <span>Google Mail</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  href="https://calendar.google.com"
                  target="_blank"
                  tooltip="Google Calendar"
                  size="sm"
                  className="h-8"
                >
                  <Calendar />
                  <span>Google Calendar</span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  href="https://www.office.com"
                  target="_blank"
                  tooltip="Microsoft 365"
                  size="sm"
                  className="h-8"
                >
                  <Database />
                  <span>Microsoft 365</span>
                </SidebarMenuButton>
              </div>
            )}
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
