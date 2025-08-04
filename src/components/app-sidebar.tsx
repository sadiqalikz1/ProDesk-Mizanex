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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BriefcaseBusiness,
  Home,
  Users,
  Settings,
  PanelLeft,
  ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import AppLinks from './app-links';

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
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton tooltip="External Apps">
                  <ExternalLink />
                  <span>External Apps</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>External Apps</DialogTitle>
                </DialogHeader>
                <AppLinks />
              </DialogContent>
            </Dialog>
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
