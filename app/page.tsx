import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react";
import { LayoutGrid } from "lucide-react"; // or Squares2X2 from Heroicons
import { JSX } from "react";

const greenBoard = (
  <span className="flex h-6 w-6 items-center justify-center rounded-[30%] bg-emerald-500">
    <LayoutGrid className="h-3 w-3 text-white" />
  </span>
);


function createButton(text: string, elem: JSX.Element) {
  return (
    <Button variant="outline" className="max-w-min px-2! py-2 gap-1">
      { elem }
      <span className="text-sm font-semibold">{ text }</span>
      <ChevronDown stroke="#888" />
    </Button>
  )
}

export default function Home() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="max-w-min" asChild>
        { createButton("All Companies", greenBoard) }
      </DropdownMenuTrigger>
      <DropdownMenuContent>
      <DropdownMenuItem>
        Something
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
