"use client"

import * as React from "react"
import Link from "next/link"
import { Moon, Sun, Github, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function NavigationMenuDemo() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center justify-end w-full">
      <div className="flex items-center gap-2">
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
