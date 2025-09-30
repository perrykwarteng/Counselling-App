"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string; // content box classes
  overlayClassName?: string; // overlay classes
  initialFocusRef?:
    | React.RefObject<HTMLElement | null>
    | React.MutableRefObject<HTMLElement | null>;
  closeOnOverlay?: boolean; // default true
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  overlayClassName,
  initialFocusRef,
  closeOnOverlay = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // ESC close + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") handleTabTrap(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Autofocus first focusable
  useEffect(() => {
    if (!open) return;
    const el =
      initialFocusRef?.current ??
      contentRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
    el?.focus?.();
  }, [open, initialFocusRef]);

  function handleTabTrap(e: KeyboardEvent) {
    const container = contentRef.current;
    if (!container) return;
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    ).filter(
      (n) => !n.hasAttribute("disabled") && !n.getAttribute("aria-hidden")
    );

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-desc" : undefined}
      className="fixed inset-0 z-50"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[1px]",
          overlayClassName
        )}
        onClick={(e) => {
          if (!closeOnOverlay) return;
          if (e.target === overlayRef.current) onClose();
        }}
      />

      {/* Centered container */}
      <div className="fixed inset-0 grid place-items-center p-2 sm:p-4">
        {/* Content box with fixed header/footer and scrolling body */}
        <div
          ref={contentRef}
          className={cn(
            "w-full max-w-[95vw] sm:max-w-2xl bg-white rounded-xl shadow-xl outline-none",
            "max-h-[90vh] overflow-hidden flex flex-col",
            className
          )}
          tabIndex={-1}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6 border-b">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-base sm:text-lg font-semibold"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-desc"
                    className="text-xs sm:text-sm text-muted-foreground"
                  >
                    {description}
                  </p>
                )}
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                className="rounded-md p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6">
            {children}
          </div>

          {footer && (
            <div className="shrink-0 px-4 py-4 sm:px-6 border-t">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
