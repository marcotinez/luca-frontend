"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  compact?: boolean;
}

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Laptop },
];

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (theme || "system") as ThemeOption;
  const effectiveTheme = (resolvedTheme || "light") as "light" | "dark";

  const triggerLabel = useMemo(() => {
    if (!mounted) return "Tema";
    if (currentTheme === "system") {
      return `Sistema (${effectiveTheme === "dark" ? "Oscuro" : "Claro"})`;
    }
    return currentTheme === "dark" ? "Oscuro" : "Claro";
  }, [mounted, currentTheme, effectiveTheme]);

  const TriggerIcon = effectiveTheme === "dark" ? Moon : Sun;

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cambiar tema">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={compact ? "rounded-full" : "gap-2 rounded-full"}
          aria-label="Cambiar tema"
        >
          <TriggerIcon className="h-4 w-4" />
          {!compact ? <span>{triggerLabel}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const selected = currentTheme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="cursor-pointer"
            >
              <OptionIcon className="h-4 w-4" />
              <span>{option.label}</span>
              {selected ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
