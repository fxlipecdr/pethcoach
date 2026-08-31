import { requireUser } from "@/lib/security/auth";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser((await headers()).get("x-pethcoach-pathname") ?? "/app");
  return <WorkspaceShell area="app">{children}</WorkspaceShell>;
}
