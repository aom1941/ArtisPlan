import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { isCompanionConfigured, fetchCompanionVitals, type CompanionVitals } from '../lib/companionBridge';

/**
 * Small Navbar pill showing Project Companion OS's shared Ollama load
 * (same /api/vitals the OS's own desktop widget polls) — a heads-up before
 * kicking off a Moodboard/Timeline/Critique generation that would otherwise
 * queue behind other Ollama consumers (RAG search, PICAS) on the same
 * self-hosted instance. Self-contained: no-ops entirely when the OS bridge
 * isn't configured (standalone ArtisPlan), so Navbar doesn't need to know
 * about polling or the /api/vitals shape.
 */
export const CompanionVitalsPill: React.FC = () => {
  const [vitals, setVitals] = useState<CompanionVitals | null>(null);

  useEffect(() => {
    if (!isCompanionConfigured()) return;
    let cancelled = false;

    const poll = () => {
      fetchCompanionVitals().then((data) => {
        if (!cancelled) setVitals(data);
      });
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!isCompanionConfigured() || !vitals) return null;

  const busy = vitals.vram_ollama_percent >= 80;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
        busy
          ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
          : 'bg-[#18181D]/90 border-zinc-800 text-zinc-400'
      }`}
      title={`Project Companion OS: ${vitals.ollama_model} @ ${vitals.vram_ollama_percent}% VRAM${busy ? ' — evtl. Wartezeit bei KI-Generierung' : ''}`}
    >
      <Cpu className={`w-3.5 h-3.5 ${busy ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
      <span className="hidden md:inline">Ollama {vitals.vram_ollama_percent}%</span>
    </div>
  );
};
