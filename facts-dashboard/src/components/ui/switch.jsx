import React from 'react';

export function Switch({ className, checked = false, onCheckedChange, ...props }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? 'bg-primary' : 'bg-input'} ${className || ''}`}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
} 