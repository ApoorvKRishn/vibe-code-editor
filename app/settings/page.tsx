import React from "react";
import { auth } from "@/auth";
import SettingsContainer from "@/modules/settings/components/settings-container";

export default async function SettingsPage() {
  const session = await auth();

  return <SettingsContainer user={session?.user} />;
}
