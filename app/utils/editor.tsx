"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import AceEditor from "react-ace";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/ext-language_tools";

interface MyQueryEditorProps {
  value: string;
  onChange: (value: string, event?: any) => void;
  className?: string;
  language: string;
  uniqueDivName?: string;
}

export default function MyQueryEditor({
  value,
  onChange,
  className,
  language,
  uniqueDivName
}: MyQueryEditorProps) {
  const { resolvedTheme } = useTheme();
  const [editorTheme, setEditorTheme] = useState<"github" | "tomorrow_night">(
    "github",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log(resolvedTheme);
    if (!resolvedTheme) return;

    console.log(resolvedTheme);
    setEditorTheme(resolvedTheme === "dark" ? "tomorrow_night" : "github");
  }, [resolvedTheme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className={`relative h-full ${className || ""}`} id="main-query-editor">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 h-7 w-7"
        aria-label={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </Button>
      <AceEditor
        mode={language}
        theme={editorTheme}
        value={value}
        onChange={onChange}
        name={uniqueDivName}
        className="ace-editor-styled"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        height="100%"
        setOptions={{
          showPrintMargin: false,
          fontSize: 14,
          // Use a stable monospace stack here to avoid any spacing glitches
          // between the cursor and text that can happen with some custom fonts.
          fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
          useWorker: false,
          showLineNumbers: true,
          tabSize: 2,
          highlightActiveLine: false,
          highlightGutterLine: false,
          // Use the default cursor style to avoid visual offset artifacts
          cursorStyle: "ace",
        }}
      />
    </div>
  );
}