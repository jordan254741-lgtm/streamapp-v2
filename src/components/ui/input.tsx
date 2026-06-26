import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 outline-none selection:bg-white/20 placeholder:text-neutral-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
        'focus:border-white/20 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
