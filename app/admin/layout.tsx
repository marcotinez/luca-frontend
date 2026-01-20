'use client';

import { AdminRoute } from "@/components/AdminRoute";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ShieldCheck, Users, Sparkles, LayoutDashboard, Database } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Vista General",
      href: "/admin",
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      label: "Usuarios",
      href: "/admin/usuarios",
      icon: <Users className="w-4 h-4" />
    },
    {
      label: "Preguntas",
      href: "/admin/preguntas",
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      label: "Ingesta",
      href: "/admin/ingesta",
      icon: <Database className="w-4 h-4" />
    }
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNavbar />

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Administrador */}
          <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>Panel Admin</span>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Contenido Principal */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
