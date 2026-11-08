/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';
import { LOGO_URL } from '../lib/db';

interface BreathingExerciseProps {
  onClose?: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<
  Phase,
  { label: string; duration: number; guidance: string; ringColor: string; bgPulse: string }
> = {
  inhale: {
    label: 'Inhala suavemente',
    duration: 4,
    guidance: 'Inhala despacito por la nariz, sintiendo cómo se llena tu pecho de aire fresco.',
    ringColor: '#9C82DF',
    bgPulse: 'bg-[#F3EFFF] dark:bg-[#23183B]'
  },
  hold: {
    label: 'Sostén el aire',
    duration: 4,
    guidance: 'Mantén el aire con calma; siente la quietud y la paz en tu cuerpo.',
    ringColor: '#E6BD50',
    bgPulse: 'bg-[#FFFBEB] dark:bg-[#261F12]'
  },
  exhale: {
    label: 'Exhala despacio',
    duration: 6,
    guidance: 'Suelta todo el aire por la boca, como si acariciaras una plumita.',
    ringColor: '#62B87D',
    bgPulse: 'bg-[#EDF9F0] dark:bg-[#122419]'
  }
};

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return PHASE_CONFIG.hold.duration;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return PHASE_CONFIG.exhale.duration;
            } else {
              setPhase('inhale');
              setCyclesCompleted(c => c + 1);
              return PHASE_CONFIG.inhale.duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const handleToggle = () => {
    setIsActive(prev => !prev);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setSecondsLeft(PHASE_CONFIG.inhale.duration);
    setCyclesCompleted(0);
  };

  const currentCfg = PHASE_CONFIG[phase];

  return (
    <div
      role="region"
      aria-label="Técnica de respiración diafragmática 4-4-6"
      className="bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] rounded-3xl p-6 sm:p-8 text-center max-w-md mx-auto shadow-sm transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F3EFFF] dark:bg-[#271F42] flex items-center justify-center text-[#8C71D6] dark:text-[#C4B5FD]">
            <Wind className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#2D2938] dark:text-[#F1F5F9]">
            Respiración Guiada 4-4-6
          </h2>
        </div>
        <div className="text-xs text-[#7E7788] dark:text-[#94A3B8] tabular-nums bg-[#FAF8F5] dark:bg-[#161F36] px-2.5 py-1 rounded-full border border-[#EFEAE1] dark:border-[#1E293B]">
          Ciclos: <span className="font-bold text-[#8C71D6] dark:text-[#C4B5FD]">{cyclesCompleted}</span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-[#6B6576] dark:text-[#94A3B8] mb-6 max-w-xs mx-auto leading-relaxed">
        Felt.O respira contigo 🐾. Este ejercicio calma el sistema nervioso y alivia la tensión con suavidad.
      </p>

      {/* Visual Breathing Ring with puppy logo */}
      <div className="relative flex items-center justify-center my-6 min-h-[220px]">
        {/* Soft pulse background */}
        <div
          className={`absolute w-48 h-48 rounded-full transition-all duration-1000 ease-in-out ${
            isActive ? `${currentCfg.bgPulse} scale-120` : 'bg-[#FAF8F5] dark:bg-[#161F36] scale-100'
          }`}
          aria-hidden="true"
        />

        {/* Center circle */}
        <div className="relative z-10 w-40 h-40 rounded-full border-2 border-[#EFEAE1] dark:border-[#232B45] bg-white dark:bg-[#161F36] flex flex-col items-center justify-center p-3 shadow-xs">
          <div className="w-12 h-12 rounded-full overflow-hidden p-1 bg-white dark:bg-white border border-[#EFEAE1] dark:border-[#C4B5FD] shadow-xs mb-1">
            <img
              src={LOGO_URL}
              alt="Felt.O Cachorro"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#8C71D6] dark:text-[#C4B5FD] uppercase">
            {isActive ? currentCfg.label : 'Listos'}
          </span>
          <span className="text-3xl font-bold text-[#2D2938] dark:text-[#F1F5F9] tabular-nums my-0.5">
            {isActive ? secondsLeft : '4-4-6'}
          </span>
          <span className="text-[10px] text-[#9A94A4] dark:text-[#94A3B8]">
            {isActive ? 'segundos' : 'pulsa iniciar'}
          </span>
        </div>
      </div>

      {/* Active guidance note */}
      <p
        aria-live="polite"
        className="text-xs sm:text-sm font-medium text-[#4D4857] dark:text-[#CBD5E1] min-h-[44px] flex items-center justify-center px-4 mb-6"
      >
        {isActive ? currentCfg.guidance : 'Presiona Iniciar para sincronizar tu respiración con Felt.O.'}
      </p>

      {/* Action controls in pastel tones */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] dark:bg-[#7C5FD1] dark:hover:bg-[#6C4EB8] transition-colors shadow-xs"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" aria-hidden="true" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{cyclesCompleted > 0 ? 'Continuar' : 'Iniciar'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          aria-label="Reiniciar respiración"
          className="inline-flex items-center justify-center p-2.5 rounded-2xl border border-[#EFEAE1] dark:border-[#1E293B] bg-white dark:bg-[#161F36] text-[#6B6576] dark:text-[#CBD5E1] hover:bg-[#FAF8F5] dark:hover:bg-[#202B4B] transition-colors"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#7E7788] dark:text-[#94A3B8] hover:text-[#2D2938] dark:hover:text-[#F1F5F9] transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};
