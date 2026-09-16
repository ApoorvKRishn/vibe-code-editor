"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import {
  User,
  Settings,
  Palette,
  Bot,
  LogOut,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  Laptop,
  Code2,
  Sparkles,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SettingsUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export default function SettingsContainer({ user }: { user?: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Editor settings state
  const [fontSize, setFontSize] = useState("14");
  const [tabSize, setTabSize] = useState("2");
  const [autoSave, setAutoSave] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  // AI settings state
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("codellama:latest");
  const [enableAiCompletions, setEnableAiCompletions] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Load stored settings from localStorage if available
    const storedFontSize = localStorage.getItem("vibe_font_size");
    if (storedFontSize) setFontSize(storedFontSize);

    const storedTabSize = localStorage.getItem("vibe_tab_size");
    if (storedTabSize) setTabSize(storedTabSize);

    const storedAutoSave = localStorage.getItem("vibe_auto_save");
    if (storedAutoSave !== null) setAutoSave(storedAutoSave === "true");

    const storedOllamaUrl = localStorage.getItem("vibe_ollama_url");
    if (storedOllamaUrl) setOllamaUrl(storedOllamaUrl);

    const storedOllamaModel = localStorage.getItem("vibe_ollama_model");
    if (storedOllamaModel) setOllamaModel(storedOllamaModel);
  }, []);

  const handleSavePreferences = () => {
    localStorage.setItem("vibe_font_size", fontSize);
    localStorage.setItem("vibe_tab_size", tabSize);
    localStorage.setItem("vibe_auto_save", String(autoSave));
    localStorage.setItem("vibe_line_numbers", String(lineNumbers));
    localStorage.setItem("vibe_word_wrap", String(wordWrap));
    localStorage.setItem("vibe_editor_theme", editorTheme);
    localStorage.setItem("vibe_ollama_url", ollamaUrl);
    localStorage.setItem("vibe_ollama_model", ollamaModel);
    localStorage.setItem("vibe_ai_enabled", String(enableAiCompletions));

    toast.success("Settings saved successfully!");
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-5xl px-4 py-10 w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            Account & Editor Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, theme preferences, code editor configurations, and AI completions.
          </p>
        </div>

        <Button
          onClick={handleSavePreferences}
          className="flex items-center gap-2 self-start md:self-auto"
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Editor & Theme
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile & Account */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> User Profile Information
              </CardTitle>
              <CardDescription>
                Your personal account details synced from your authentication provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-xl font-semibold">{user?.name || "Anonymous User"}</h2>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {user?.role || "Member"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email || "No email provided"}</p>
                  <p className="text-xs text-muted-foreground pt-1">User ID: {user?.id || "N/A"}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} disabled readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue={user?.email || ""} disabled readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" /> Account Actions
              </CardTitle>
              <CardDescription>
                Sign out of your active session on Vibe Code Editor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out of Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Appearance & Editor Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Application Theme
              </CardTitle>
              <CardDescription>
                Customize the visual interface of the Vibe Code Editor dashboard and pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                <Button
                  variant={mounted && theme === "light" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 gap-2 border-2"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-6 w-6" />
                  <span>Light</span>
                </Button>

                <Button
                  variant={mounted && theme === "dark" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 gap-2 border-2"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-6 w-6" />
                  <span>Dark</span>
                </Button>

                <Button
                  variant={mounted && theme === "system" ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 gap-2 border-2"
                  onClick={() => setTheme("system")}
                >
                  <Laptop className="h-6 w-6" />
                  <span>System</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" /> Monaco Code Editor Options
              </CardTitle>
              <CardDescription>
                Configure font size, indentation, line numbers, and behavior inside code playgrounds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size (px)</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger id="fontSize">
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 px (Compact)</SelectItem>
                      <SelectItem value="14">14 px (Standard)</SelectItem>
                      <SelectItem value="16">16 px (Large)</SelectItem>
                      <SelectItem value="18">18 px (Extra Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tabSize">Tab Size (Spaces)</Label>
                  <Select value={tabSize} onValueChange={setTabSize}>
                    <SelectTrigger id="tabSize">
                      <SelectValue placeholder="Select tab size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Spaces</SelectItem>
                      <SelectItem value="4">4 Spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto-Save Code Changes</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically persist edits to your playground state.
                    </p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Show Line Numbers</Label>
                    <p className="text-xs text-muted-foreground">
                      Display line numbers along the left margin of the code editor.
                    </p>
                  </div>
                  <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Word Wrap</Label>
                    <p className="text-xs text-muted-foreground">
                      Wrap long lines of code to prevent horizontal scrolling.
                    </p>
                  </div>
                  <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: AI & Integrations */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Code Completion Settings
              </CardTitle>
              <CardDescription>
                Configure local Ollama AI backend connection and model parameters for smart code suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" /> Enable AI Code Suggestions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Provide real-time code completion proposals inside the editor.
                  </p>
                </div>
                <Switch
                  checked={enableAiCompletions}
                  onCheckedChange={setEnableAiCompletions}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ollamaUrl">Ollama Server Endpoint</Label>
                  <Input
                    id="ollamaUrl"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                  <p className="text-xs text-muted-foreground">
                    Base URL where your local Ollama instance is hosted.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ollamaModel">Default AI Model</Label>
                  <Select value={ollamaModel} onValueChange={setOllamaModel}>
                    <SelectTrigger id="ollamaModel">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="codellama:latest">CodeLlama (Latest)</SelectItem>
                      <SelectItem value="llama3:latest">Llama 3 (Latest)</SelectItem>
                      <SelectItem value="deepseek-coder:latest">DeepSeek Coder</SelectItem>
                      <SelectItem value="qwen2.5-coder:latest">Qwen 2.5 Coder</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Model used by the code completion endpoint.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold">Backend Integration Status:</span> Connected via{" "}
                  <code className="bg-background px-1.5 py-0.5 rounded border">
                    /api/code-completion
                  </code>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={handleSavePreferences} className="gap-2">
                <Save className="h-4 w-4" /> Save AI Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
