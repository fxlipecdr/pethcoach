import { requireAdmin } from "@/lib/security/auth";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <WorkspaceShell area="admin">{children}</WorkspaceShell>;
}
