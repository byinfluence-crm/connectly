'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ChevronRight, X } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
  critical?: boolean;
}

interface Props {
  role: 'brand' | 'creator';
  steps: OnboardingStep[];
}

export function OnboardingChecklist({ role, steps }: Props) {
  const storageKey = `onboarding_dismissed_${role}`;
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  if (!mounted) return null;

  const doneCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  if (dismissed || doneCount === total) return null;

  const nextStep = steps.find(s => !s.done);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, 'true');
  };

  return (
    <div className="bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            🚀
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Completa tu perfil</div>
            <div className="text-xs text-gray-500">{doneCount} de {total} pasos · {pct}% completado</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Descartar"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed ? (
        <div className="divide-y divide-gray-50">
          {steps.map(step => (
            step.done ? (
              <div key={step.id} className="flex items-center gap-3 px-5 py-3 opacity-50">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-gray-400 line-through">{step.label}</span>
              </div>
            ) : (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-violet-50/50 transition-colors"
              >
                <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                    {step.label}
                    {step.critical && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        Necesario
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{step.hint}</div>
                </div>
                <ChevronRight size={14} className="text-gray-300 mt-1 flex-shrink-0" />
              </Link>
            )
          ))}
        </div>
      ) : nextStep ? (
        <Link
          href={nextStep.href}
          className="flex items-center gap-2 px-5 py-3 bg-violet-50/50 border-t border-violet-100 hover:bg-violet-100/50 transition-colors"
        >
          <Circle size={14} className="text-gray-300 flex-shrink-0" />
          <span className="text-xs font-semibold text-violet-700">Siguiente: {nextStep.label}</span>
          <ChevronRight size={12} className="text-violet-400 ml-auto" />
        </Link>
      ) : null}
    </div>
  );
}
