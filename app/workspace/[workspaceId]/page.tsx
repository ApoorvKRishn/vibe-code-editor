import { auth } from "@/auth";
import { getWorkspaceById } from "@/modules/workspaces/actions";
import { WorkspaceIDE } from "@/modules/editor/components/workspace-ide";
import { WorkspaceData } from "@/modules/editor/types";
import { notFound, redirect } from "next/navigation";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    notFound();
  }

  return <WorkspaceIDE initialWorkspace={workspace as unknown as WorkspaceData} />;
}
