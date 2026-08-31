'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

interface GuardedLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  /** Si hay cambios sin guardar, pide confirmación antes de navegar. */
  isDirty: boolean;
}

export const GuardedLink = forwardRef<HTMLAnchorElement, GuardedLinkProps>(
  ({ isDirty, onClick, ...props }, ref) => (
    <Link
      {...props}
      ref={ref}
      onClick={(event) => {
        if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  )
);
GuardedLink.displayName = 'GuardedLink';
