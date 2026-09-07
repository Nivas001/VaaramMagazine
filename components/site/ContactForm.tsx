"use client";

import { DirectContactHub } from "@/components/site/DirectContactHub";

/**
 * Zero-input contact component. Replaces legacy form inputs with direct,
 * instant 1-click WhatsApp and Email access.
 */
export function ContactForm({ variant = "contact" }: { variant?: "contact" | "advertise" }) {
  return <DirectContactHub variant={variant} />;
}
