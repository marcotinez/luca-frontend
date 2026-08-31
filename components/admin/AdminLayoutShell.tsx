'use client';

import { RouteGuard } from "@/components/auth/RouteGuard";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import {
  ShieldCheck,
  Users,
  Sparkles,
  LayoutDashboard,
  Database,
  Search,
  FileSearch,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isNavItemActive = (href: string) => {
    if (href === "/admin" || href === "/admin/generador") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navSections = [
    {
      title: "General",
      items: [
        {
          label: "Vista General",
          href: "/admin",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        {
          label: "Gestión de usuarios",
          href: "/admin/usuarios",
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: "Gestión de preguntas",
          href: "/admin/preguntas",
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          label: "Gestión de tests",
          href: "/admin/evaluaciones",
          icon: <ClipboardCheck className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Generación",
      items: [
        {
          label: "Generador de preguntas",
          href: "/admin/generador",
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          label: "Trazas OpenAI",
          href: "/admin/openai-logs",
          icon: <FileSearch className="w-4 h-4" />,
        },
        {
          label: "Progreso global",
          href: "/admin/generador/progreso-global",
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Conocimiento",
      items: [
        {
          label: "Ingesta de documentos",
          href: "/admin/ingesta",
          icon: <Database className="w-4 h-4" />,
        },
        {
          label: "Consultas sobre el grafo",
          href: "/admin/consultas",
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: "Estadísticas del grafo",
          href: "/admin/estadisticas-grafo",
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Configuración IA",
      items: [
        {
          label: "Configuración IA",
          href: "/admin/generador/configuracion",
          icon: <Sparkles className="w-4 h-4" />,
        },
      ],
    },
  ];
  const flatNavItems = navSections.flatMap((section) => section.items);

  return (
    <RouteGuard access="superuser">
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNavbar />
        <div className="md:hidden border-b border-border bg-card/90 backdrop-blur">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-2">
            <nav className="flex w-max items-center gap-2">
              {flatNavItems.map((item) => {
                const isActive = isNavItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>Panel Admin</span>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-4">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(item.href);
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
                </div>
              ))}
            </nav>
          </aside>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
