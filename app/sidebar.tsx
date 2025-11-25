"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronsUpDown, Calendar, Inbox, Search, Settings, Network, ChevronDown, FolderTree, ChevronUp, ChartBar, ChartColumn, ChartLine, Fish, Bell, GlassWater, MessagesSquare, ChartBarStacked, ChartBarStackedIcon, BottleWine, MoreVertical, Rows4, ChartColumnBig, Blocks, Cuboid, Pin, ChartArea, ChartPie, ChartSpline, ChartSplineIcon, Columns } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inter_Tight } from "next/font/google";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const interTight = Inter_Tight({
  weight: '500',
  subsets: ['latin'], // Specify subsets to reduce file size
  display: 'swap', // Use 'swap' for better performance and less layout shift
});

// Menu items.
const items = [
  {
    title: "Activity Log",
    url: "/query",
    icon: Bell,
    style: "bg-[rgb(99,91,255)] fill-amber-50 stroke-white",
  },
  {
    title: "Comments",
    url: "/query",
    icon: MessagesSquare,
    style: "bg-[rgb(252,132,167)] fill-amber-50 stroke-white",
  },
  {
    title: "SQL Console",
    url: "/timeseries",
    icon: GlassWater,
    style: "bg-[rgb(245,186,1)] fill-amber-50 stroke-white",
  },
  {
    title: "Visualize",
    url: "/turbopuffer",
    icon: ChartLine,
    style: "bg-[rgb(255,91,90)] fill-amber-50 stroke-white",
  }
]

function createSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <BottleWine />
                <span className="group-data-[collapsible=icon]:hidden">Apache Pinot</span>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
              <DropdownMenuItem>
                <span>Acme Inc</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Acme Corp.</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

export function createSidebarFooter() {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="flex items-center gap-2 group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <Avatar className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="text-xs">CN</AvatarFallback>
                </Avatar>
                <span className="group-data-[collapsible=icon]:hidden">ankitsultana</span>
                <ChevronUp className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem>
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}


export default function MySidebar() {
  return (
    <Sidebar id="my-sidebar" collapsible="icon">
      { createSidebarHeader() }
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className={cn(item.style, "p-1 rounded size-5!")} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  
                <Cuboid className="bg-[rgb(254,145,57)] fill-amber-50 stroke-white p-1 rounded size-5!" />
                  <span>Dashboards</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="group-data-[collapsible=icon]:block!">
                      <MoreVertical />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem asChild>
                      <a href="/tables">
                        <span>Create</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/tenants">
                        <span>Browse</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Pin className="bg-[rgba(254,57,57,0.82)] fill-amber-50 stroke-white p-1 rounded size-5!" />
                  <span>Saved Queries</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="group-data-[collapsible=icon]:block!">
                      <MoreVertical />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem asChild>
                      <a href="/tables">
                        <span>Create</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/tenants">
                        <span>Browse</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="bg-[rgba(0,0,0,0.32)] fill-white stroke-white p-1 rounded size-5!" />
                  <span>Manage</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="group-data-[collapsible=icon]:block!">
                      <MoreVertical />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem asChild>
                      <a href="/tables">
                        <span>Tables</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/tenants">
                        <span>Tenants</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/minions">
                        <span>Minions</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {["One", "Two", "Three"].map((item) => (
                <SidebarMenuItem key={item}>
                  <SidebarMenuButton asChild>
                    <a href={`/${item.toLowerCase()}`}>
                      <Badge className="bg-[rgba(245,240,255)] text-[rgb(153,108,250)]">
                        Dash
                      </Badge>
                      <span>{item}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      { createSidebarFooter() }
    </Sidebar>
  );
}