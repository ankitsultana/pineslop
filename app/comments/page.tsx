import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ArrowDownAZ, ChartArea, ChevronDown, Filter, LayoutGrid, Link } from "lucide-react";
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
  pp: string,
}

const items: CardDetails[] = [
  {
    'comment': 'I deleted production. Happy Thanksgiving.',
    'author': 'Ankit Sultana',
    'dt': new Date('2025-11-23T03:00:00Z'),
    'contextId': 'server-1.host.ankitsultana.com',
    'pp': 'me.jpeg',
  },
  {
    'comment': 'Wth man',
    'author': 'Ankit Sultana',
    'dt': new Date('2025-11-23T03:00:00Z'),
    'contextId': 'adsPerformance',
    'pp': '/me.jpeg',
  }
]

function createCard(cardDetails: CardDetails[]) {
  return cardDetails.map((card) => (
    <Item
      key={card.contextId}
      variant="outline"
      className="w-[60%]"
    >
      <ItemMedia variant="image">
        <img
          src={card.pp}
          alt={card.author}
        />
      </ItemMedia>
      <ItemContent>
        <ItemHeader>
          <ItemTitle className="gap-0 flex flex-col items-start text-base font-semibold">
            <span>{card.author}</span>
            <span className="text-xs text-black font-normal">
              {card.dt.toDateString()}
            </span>
          </ItemTitle>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              className="py-1 text-xs px-2 rounded-xl border-[rgb(230,251,255)] bg-[rgb(255,255,255)] text-[rgb(64,128,242)] shadow-none border-[1px]"
            >
              <span className="font-semibold"><Link className="size-3!" /></span>
              {card.contextId}
            </Button>
          </ItemActions>
        </ItemHeader>
        <ItemDescription className="text-gray-800 mt-1">
          {card.comment}
        </ItemDescription>
      </ItemContent>
    </Item>
  ))
}

export default function Activity() {
  return (
    <>
    <div className="flex flex-row w-full p-2">
      { createDropdownFixedDynamicButton("Cluster", "some-us-east1-cluster", <Filter />) }
      <div className="ml-auto">
        { createBlueProminentButton("Add comment") }
      </div>
    </div>
    <div className="flex flex-col p-2 pt-4 pl-4 gap-2 w-full items-center">
      { createCard(items) }
    </div>
    </>
  )
}