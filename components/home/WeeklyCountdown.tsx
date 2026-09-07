"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { whatsappLink } from "@/site.config";

/**
 * Calculates time remaining until the next Sunday at 06:00 AM EST.
 */
function getTimeUntilNextDrop() {
  const now = new Date();
  const nextSunday = new Date(now);
  const day = now.getDay();
  // If Sunday after 6am, target next Sunday (7 days later), else this Sunday
  const daysUntilSunday = (7 - day) % 7 || (now.getHours() >= 6 ? 7 : 0);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(6, 0, 0, 0);

  const diff = Math.max(0, nextSunday.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function WeeklyCountdown() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeUntilNextDrop());
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNextDrop());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl border border-neutral-800 bg-[#0c0c0c] p-4 text-center">
        <span className="font-display text-xs uppercase tracking-widest text-[#d2ac47]">
          LOADING NEXT ISSUE COUNTDOWN…
        </span>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden border border-neutral-800 bg-[#090909] p-4 sm:p-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-[#cd2129]" />
      
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-3 text-left">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#cd2129] opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-[#cd2129]" />
          </span>
          <div>
            <div className="flex items-center gap-2 font-display text-xs tracking-widest text-[#d2ac47] uppercase">
              <Sparkles className="size-3 text-[#d2ac47]" />
              WEEKLY DROP COUNTDOWN
            </div>
            <p className="font-display text-base tracking-wider text-white uppercase sm:text-lg">
              NEXT EDITION PUBLISHES SUNDAY 6:00 AM
            </p>
          </div>
        </div>

        {/* Live Timer Grid */}
        <div className="flex items-center gap-2 font-display">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HRS", val: timeLeft.hours },
            { label: "MIN", val: timeLeft.minutes },
            { label: "SEC", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="flex min-w-[54px] flex-col items-center border border-neutral-800 bg-[#121212] px-2 py-1.5">
                <span className="text-xl font-normal tabular-nums text-white sm:text-2xl">
                  {String(item.val).padStart(2, "0")}
                </span>
                <span className="font-sans text-[9px] font-bold tracking-widest text-neutral-500 uppercase">
                  {item.label}
                </span>
              </div>
              {idx < 3 && <span className="text-sm font-bold text-neutral-700">:</span>}
            </div>
          ))}
        </div>

        {/* WhatsApp Sunday Alerts Button */}
        <a
          href={whatsappLink("Hello Vaaram Magazine, please send me an alert on WhatsApp every Sunday at 6:00 AM when the new issue is published!")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-2 border border-[#25D366]/60 bg-[#25D366]/10 px-4 font-bold text-xs uppercase tracking-wider text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all"
        >
          <MessageCircle className="size-3.5" />
          SUNDAY DROP ALERTS
        </a>
      </div>
    </div>
  );
}
