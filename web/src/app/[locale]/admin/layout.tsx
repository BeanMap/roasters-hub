import { requireAdminPage } from "@/lib/auth";
import { AdminNav } from "./_components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminName = await requireAdminPage();

  return (
    <div className="min-h-screen bg-surface-container-low">
      <AdminNav name={adminName} />
      {children}
    </div>
  );
}
