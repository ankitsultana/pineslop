import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ArrowDownAZ, ChartArea, ChevronDown, SortAsc } from "lucide-react";
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

function createBlueProminentButton(text: string) {
  return (
    <Button variant="outline" className="max-w-min px-2! py-0! gap-0! bg-[rgb(38,110,240)] text-white hover:bg-[rgb(30,90,220)] hover:text-white">
      <ChartArea />
      <span className="text-sm font-semibold text-white">{ text }</span>
    </Button>
  )
}

function createDropdownFixedDynamicButton(fixedText: string, dynamicText: string) {
  return (
    <Button variant="outline" className="bg-[rgb(251,251,251)] max-w-min px-2! py-2 gap-1">
      <ArrowDownAZ />
      <span className="text-sm font-light">{ fixedText }</span>
      <span className="text-sm font-semibold">{ dynamicText }</span>
      <ChevronDown stroke="#888" />
    </Button>
  )
}

export default function Home() {
  return (
    <>
      <DropdownMenu key="companies">
        <DropdownMenuTrigger className="max-w-min" asChild>
          { createButton("All Companies", greenBoard) }
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Something
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu key="add-report-1">
        <DropdownMenuTrigger className="max-w-min" asChild>
          { createBlueProminentButton("Add report") }
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Something
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu key="add-report-2">
        <DropdownMenuTrigger className="max-w-min" asChild>
          { createBlueProminentButton("  Add report") }
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Something
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu key="add-report-3">
        <DropdownMenuTrigger className="max-w-min" asChild>
          { createDropdownFixedDynamicButton("Sorted by", "order_timestamp_utc") }
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Something
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
