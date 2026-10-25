"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Download, Minus, Moon, Plus, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { MAX_FONT_SIZE, MIN_FONT_SIZE, useEditorSettings } from "../hooks/useEditorSettings";

interface SettingsMenuProps {
  /** Name of the file in the editor, e.g. "g2.cpp", or null if none is open. */
  activeFileName: string | null;
  onDownloadActiveFile: () => void;
}

export function SettingsMenu({ activeFileName, onDownloadActiveFile }: SettingsMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { fontSize, changeFontSize } = useEditorSettings();
  const isDark = resolvedTheme !== "light";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* preventDefault keeps the menu open so the theme can be toggled back and forth. */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTheme(isDark ? "light" : "dark");
              }}
            >
              {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>

            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span>Font size</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Decrease font size"
                  disabled={fontSize <= MIN_FONT_SIZE}
                  onClick={() => changeFontSize(-1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-mono text-xs">{fontSize}px</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Increase font size"
                  disabled={fontSize >= MAX_FONT_SIZE}
                  onClick={() => changeFontSize(1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!activeFileName} onSelect={onDownloadActiveFile}>
              <Download className="h-4 w-4 mr-2" />
              <span className="truncate">Download {activeFileName ?? "file"}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Ctrl+Enter runs the file · Ctrl+S saves
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
