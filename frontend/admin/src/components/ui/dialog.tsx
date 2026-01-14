"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50",
        // мягкий но достаточный затемняющий слой
        "bg-black/55 backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />

      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2",
          "translate-x-[-50%] translate-y-[-50%]",
          // контент строго выше overlay
          "z-[60]",
          "grid w-full max-w-[calc(100%-2rem)] sm:max-w-[640px]",
          "gap-6 rounded-2xl border shadow-2xl",
          "p-8",

          // ✅ ЖЁСТКО светлая модалка (как в Figma), без зависимости от токенов/тем
          "bg-white text-slate-900 opacity-100",
          "border-slate-200",

          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200",

          className,
        )}
        {...props}
      >
        {children}

        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 rounded-lg p-2",
            "text-slate-500 hover:text-slate-900",
            "hover:bg-slate-100",
            "outline-none focus-visible:ring-2 focus-visible:ring-black/10",
            "disabled:pointer-events-none",
          )}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-xl font-semibold leading-none", className)}
      {...rest}
    />
  );
}

function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-slate-500", className)}
      {...rest}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
