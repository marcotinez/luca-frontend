'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Lock, PencilLine } from 'lucide-react';

type PromptEditorFieldProps = {
  label: string;
  description?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
  className?: string;
  footer?: ReactNode;
};

export function PromptEditorField({
  label,
  description,
  value,
  onChange,
  readOnly = false,
  rows = 18,
  className,
  footer,
}: PromptEditorFieldProps) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm',
        readOnly && 'border-dashed bg-muted/20'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-semibold text-foreground">{label}</Label>
            <Badge variant={readOnly ? 'secondary' : 'outline'} className="gap-1">
              {readOnly ? <Lock className="h-3.5 w-3.5" /> : <PencilLine className="h-3.5 w-3.5" />}
              {readOnly ? 'Solo lectura' : 'Editable'}
            </Badge>
          </div>
          {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <span className="text-xs text-muted-foreground">{value.length} caracteres</span>
      </div>

      <Textarea
        value={value}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (event) => onChange?.(event.target.value)}
        rows={rows}
        spellCheck={false}
        className={cn(
          'min-h-[420px] resize-y rounded-xl border-border/70 bg-background px-4 py-3 font-mono text-sm leading-6',
          readOnly &&
            'cursor-text border-dashed bg-muted/30 text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0',
          className
        )}
      />

      {footer ? <div className="space-y-2">{footer}</div> : null}
    </section>
  );
}
