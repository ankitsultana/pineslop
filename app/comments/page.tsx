import { Button } from "@/components/ui/button";
import { ArrowDownAZ, ChartArea, ChevronDown, Filter, LayoutGrid } from "lucide-react";
import { JSX } from "react";

const greenBoard = (
  <span className="flex h-6 w-6 items-center justify-center rounded-[30%] bg-emerald-500">
    <LayoutGrid className="h-3 w-3 text-white" />
  </span>
);


function createButton(text: string, elem: JSX.Element) {
  return (
    <Button variant="outline" className="max-w-min px-2! py-2 gap-1 border-[0.1px]">
      { elem }
      <span className="text-sm font-semibold text-[rgb(28,29,31)]">{ text }</span>
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

function createDropdownFixedDynamicButton(fixedText: string, dynamicText: string, icon: any) {
  return (
    <Button variant="outline" className="bg-[rgb(251,251,251)] max-w-min px-2! py-2 gap-1">
      { icon }
      <span className="text-sm font-light">{ fixedText }</span>
      <span className="text-sm font-semibold">{ dynamicText }</span>
      <ChevronDown stroke="#888" />
    </Button>
  )
}

interface CardDetails {
  comment: string,
  author: string,
  dt: Date,
  contextId: string,
}

const items: CardDetails[] = [
  {
    'comment': 'I deleted production. Happy Thanksgiving.',
    'author': 'Ankit Sultana',
    'dt': new Date('2025-11-23T03:00:00Z'),
    'contextId': 'uuid-1',
  },
  {
    'comment': 'Wth man',
    'author': 'Ankit Sultana',
    'dt': new Date('2025-11-23T03:00:00Z'),
    'contextId': 'uuid-2',
  }
]

function createCard(cardDetails: CardDetails[]) {
  return cardDetails.map((card) => (
    <div
      key={card.contextId}
      className="rounded-lg borde-0 bg-gray-100 p-4 shadow-0 gap-2 w-full items-start"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs uppercase">
          {card.author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <div className="font-medium text-sm">{card.author}</div>
          <div className="text-xs text-gray-400">
            {card.dt.toDateString()}
          </div>
        </div>
      </div>
      <div className="text-gray-800 mt-2">{card.comment}</div>
    </div>
  ))
}

export default function Activity() {
  return (
    <>
    <div className="flex flex-row p-2 gap-4 w-full">
      { createDropdownFixedDynamicButton("Filter", "some-us-east1-cluster", <Filter />) }
      { createBlueProminentButton("Add comment") }
    </div>
    <div className="flex flex-col p-2 pt-4 pl-4 gap-2 w-[80%] items-center">
      { createCard(items) }
    </div>
    </>
  )
}