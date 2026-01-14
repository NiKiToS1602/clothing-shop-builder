import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium transition-all",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-black/20",
  ].join(" "),
  {
    variants: {
      variant: {
        // ✅ fixed: fallback + border/shadow чтобы не было “прозрачной” кнопки
        default:
          "bg-[var(--primary,#030213)] text-[var(--primary-foreground,#ffffff)] hover:opacity-90 border border-black/10 shadow-sm",
        destructive:
          "bg-[#d4183d] text-white hover:opacity-90 focus-visible:ring-[#d4183d]/20",
        outline:
          "border border-black/10 bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5",
        secondary:
          "bg-black/5 text-black/80 hover:bg-black/10 border border-black/10",
        ghost: "hover:bg-black/5 text-black/80",
        link: "text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
