import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react";

// segoe-ui
import { LayoutGrid } from "lucide-react"; // or Squares2X2 from Heroicons


function createButton() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-[30%] bg-emerald-500">
      <LayoutGrid className="h-3 w-3 text-white" />
    </span>
  )
}

export default function Home() {

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="px-0 py-2">
            { createButton() }
            <span className="text-sm font-semibold">All Companies</span>
            <ChevronDown stroke="#888" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
        <DropdownMenuItem>
          Top Companies
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
