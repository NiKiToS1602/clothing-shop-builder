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
        // ✅ Tailwind v4 без tailwind.config НЕ умеет bg-primary → используем CSS vars напрямую
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
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
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
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
