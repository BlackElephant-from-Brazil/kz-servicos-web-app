import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <div className="pl-64">
            <main className="p-8">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
