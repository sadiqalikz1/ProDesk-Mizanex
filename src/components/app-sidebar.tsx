'use client';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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
} from 'lucide-react';
import { Button } from './ui/button';

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              ProDesk
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSidebar()}>
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
            <SidebarMenuButton href="https://mail.google.com" target="_blank" tooltip="Google Mail">
              <Mail />
              <span>Google Mail</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="https://calendar.google.com"
              target="_blank"
              tooltip="Google Calendar"
            >
              <Calendar />
              <span>Google Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="https://www.office.com" target="_blank" tooltip="Microsoft 365">
              <Database />
              <span>Microsoft 365</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Team Workspace">
              <Users />
              <span>Team Workspace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
