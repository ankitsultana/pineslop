"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronsUpDown, Calendar, Inbox, Search, Settings, Network, ChevronDown, FolderTree, ChevronUp, ChartBar, ChartColumn, ChartLine, Fish, Bell, GlassWater } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inter_Tight } from "next/font/google";

export const interTight = Inter_Tight({
  weight: '500',
  subsets: ['latin'], // Specify subsets to reduce file size
  display: 'swap', // Use 'swap' for better performance and less layout shift
});

// Menu items.
const items = [
  {
    title: "Activity",
    url: "/query",
    icon: Bell,
  },
  {
    title: "SQL Console",
    url: "/timeseries",
    icon: GlassWater,
  },
  {
    title: "Visualize",
    url: "/turbopuffer",
    icon: ChartLine,
  },
  {
    title: "ElasticSearch",
    url: "/es",
    icon: Fish,
  }
]


export default function MySidebar() {
  return (
    <Sidebar className="font-bold fg-[rgb(251,251,251)] text-[rgb(28,29,31)]!" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <Avatar className="mb-2">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  Apache Pinot
                  <ChevronsUpDown className="ml-auto" />
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="text-[rgb(103,104,108)]" />
                      <span className={`${interTight.className} text-[rgb(28,29,31)]`}>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    Username
                    <ChevronUp className="ml-auto" />
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
    </Sidebar>
  );
}