"use client"

import * as React from "react"
import Link from "next/link"
import { Moon, Sun, Github, BookOpen, Sheet, ChevronsUpDown } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@radix-ui/react-separator"
import { Popover, PopoverTrigger } from "@/components/ui/popover"

function createCombobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between border-[0.5px] font-semibold bg-[rgb(244,245,246)] text-[rgb(28,29,31)]"
        >
          cluster-palladium-us-east1
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
    </Popover>
  )
}

export function NavigationMenuDemo() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Button variant="ghost" className="h-auto p-2 font-mono">
                <Sheet />
                Tables
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Button variant="ghost" className="h-auto p-2 font-mono">
                some_long_pinot_table_name_REALTIME
              </Button>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2 ml-auto">
        { createCombobox() }
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://docs.pinot.apache.org/" target="_blank" aria-label="Documentation">
            <BookOpen className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/apache/pinot" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
            <Github className="size-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

