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

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ProDesk
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive>
              <Home />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="https://mail.google.com" target="_blank">
              <Mail />
              Google Mail
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href="https://calendar.google.com"
              target="_blank"
            >
              <Calendar />
              Google Calendar
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="https://www.office.com" target="_blank">
              <Database />
              Microsoft 365
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Users />
              Team Workspace
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => toggleSidebar()}>
              <PanelLeft />
              Collapse
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
