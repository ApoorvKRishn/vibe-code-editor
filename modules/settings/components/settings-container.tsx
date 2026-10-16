"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Laptop, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettingsUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export default function SettingsContainer({ user }: { user?: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  // The theme is only known in the browser, so wait for mount to highlight it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Settings className="h-7 w-7" /> Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>From your GitHub account.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{user?.name || "Anonymous User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 max-w-md">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={mounted && theme === value ? "default" : "outline"}
              className="flex flex-col h-20 gap-2"
              onClick={() => setTheme(value)}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
