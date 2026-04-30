import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Check, X, Eye, EyeOff } from 'lucide-react';
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Validación de contraseña que coincide con el backendx
export const passwordValidation = z.string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula" })
  .regex(/[0-9]/, { message: "Debe contener al menos un número" });

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements = [
    { label: "Mínimo 8 caracteres", test: (pwd: string) => pwd.length >= 8 },
    { label: "Al menos una letra mayúscula (A-Z)", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Al menos un número (0-9)", test: (pwd: string) => /[0-9]/.test(pwd) },
  ];

  return (
    <div className="mt-3 space-y-2 p-3 rounded-md bg-muted/50 border border-border">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Tu contraseña debe contener:</p>
      {requirements.map((req, index) => {
        const isMet = req.test(password);
        return (
          <div key={index} className="flex items-start gap-2 text-xs">
            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
              isMet ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
            }`}>
              {isMet ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </div>
            <span className={isMet ? 'text-foreground' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};


// Componente PasswordField

interface PasswordFieldProps {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  showRequirements?: boolean;
}

export function PasswordField({
  control,
  name,
  label = "Contraseña",
  placeholder = "••••••••",
  showRequirements = true
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className="pr-10"
                {...field}
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <FormMessage />
          {/* Validación en tiempo real solo cuando el usuario ya comenzó a escribir */}
          {showRequirements && Boolean(field.value) && <PasswordRequirements password={field.value || ""} />}
        </FormItem>
      )}
    />
  );
}
