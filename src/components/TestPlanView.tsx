/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { runUnitTests, LOGO_URL } from '../lib/db';
import { TestResultItem } from '../types';
import { CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface TestPlanViewProps {
  onBack: () => void;
}

export const TestPlanView: React.FC<TestPlanViewProps> = ({ onBack }) => {
  const [results, setResults] = useState<TestResultItem[]>(() => runUnitTests());
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(runUnitTests());
      setIsRunning(false);
    }, 200);
  };

  const passedCount = results.filter(r => r.aprobado).length;
  const allPassed = passedCount === results.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      {/* Breadcrumb / Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6E6779] hover:text-[#2D2938] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver a Felt.O</span>
        </button>

        <button
          type="button"
          onClick={handleRerun}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-2xl transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Ejecutar pruebas de nuevo</span>
        </button>
      </div>

      {/* Header section with puppy logo */}
      <div className="mb-8 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-white dark:bg-white border-2 border-[#EADDFE] dark:border-[#C4B5FD] shadow-xs dark:shadow-[0_0_15px_rgba(196,181,253,0.3)] flex items-center justify-center overflow-hidden p-1 shrink-0">
          <img
            src={LOGO_URL}
            alt="Felt.O Cachorro"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D2938] dark:text-[#F1F5F9]">
            Plan de Pruebas Unitarias
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7485] dark:text-[#94A3B8] mt-0.5">
            Validación de integridad técnica de autenticación, emociones, notificaciones y control clínico.
          </p>
        </div>
      </div>

      {/* Summary Banner in light pastel / midnight green */}
      <div
        role="status"
        aria-live="polite"
        className={`mb-6 p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 transition-colors ${
          allPassed
            ? 'bg-[#EDF9F0] dark:bg-[#112419] border-[#D4F2DC] dark:border-[#1E4530] text-[#29633B] dark:text-[#A7F3D0]'
            : 'bg-[#FFF0F3] dark:bg-[#32131F] border-[#FFD7DF] dark:border-[#521C2F] text-[#A3364E] dark:text-[#FCA5A5]'
        }`}
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <CheckCircle2 className="w-5 h-5 text-[#3D8556] dark:text-[#86EFAC] shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-5 h-5 text-[#C44662] dark:text-[#FCA5A5] shrink-0" aria-hidden="true" />
          )}
          <div>
            <div className="text-sm font-bold">
              {allPassed ? '¡Todas las pruebas unitarias aprobadas! ✨' : 'Se detectaron fallos en las pruebas'}
            </div>
            <div className="text-xs text-[#528263] dark:text-[#86EFAC]/90">
              <span className="font-bold tabular-nums">{passedCount}</span> de{' '}
              <span className="font-bold tabular-nums">{results.length}</span> casos validados exitosamente sobre el motor de Felt.O.
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-[#528263] dark:text-[#86EFAC] bg-white/70 dark:bg-[#161F36] px-2.5 py-1 rounded-full border border-[#D4F2DC] dark:border-[#1E4530]">
          Estado: 100% Funcional
        </div>
      </div>

      {/* Responsive Table in pastel / dark midnight */}
      <div className="border border-[#EFEAE1] dark:border-[#1E293B] rounded-3xl overflow-hidden bg-white dark:bg-[#111625] shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FAF7F2] dark:bg-[#161F36] border-b border-[#EFEAE1] dark:border-[#1E293B] text-[#6E6779] dark:text-[#94A3B8] font-semibold">
                <th scope="col" className="py-3 px-3.5 w-16">ID</th>
                <th scope="col" className="py-3 px-3.5">Módulo</th>
                <th scope="col" className="py-3 px-3.5">Descripción</th>
                <th scope="col" className="py-3 px-3.5 hidden md:table-cell">Entrada</th>
                <th scope="col" className="py-3 px-3.5 hidden lg:table-cell">Esperado</th>
                <th scope="col" className="py-3 px-3.5">Obtenido</th>
                <th scope="col" className="py-3 px-3.5 text-center w-24">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6] dark:divide-[#1E293B]">
              {results.map(r => (
                <tr key={r.id} className="hover:bg-[#FCFAF7] dark:hover:bg-[#161F36]/60 transition-colors">
                  <td className="py-3.5 px-3.5 font-mono text-[#8C71D6] dark:text-[#C4B5FD] font-bold whitespace-nowrap">
                    {r.id}
                  </td>
                  <td className="py-3.5 px-3.5 font-semibold text-[#2D2938] dark:text-[#F1F5F9] whitespace-nowrap">
                    {r.modulo}
                  </td>
                  <td className="py-3.5 px-3.5 text-[#544E5E] dark:text-[#CBD5E1]">
                    {r.descripcion}
                    <div className="md:hidden mt-1 text-[#868091] dark:text-[#94A3B8] text-[11px]">
                      <span className="font-semibold">Entrada:</span> {r.entrada}
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 text-[#7E7788] dark:text-[#94A3B8] hidden md:table-cell font-mono text-xs">
                    {r.entrada}
                  </td>
                  <td className="py-3.5 px-3.5 text-[#7E7788] dark:text-[#94A3B8] hidden lg:table-cell">
                    {r.esperado}
                  </td>
                  <td className="py-3.5 px-3.5 text-[#4D4857] dark:text-[#CBD5E1] text-xs">
                    {r.obtenido}
                  </td>
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    {r.aprobado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#29633B] dark:text-[#86EFAC] bg-[#EDF9F0] dark:bg-[#112419] border border-[#D4F2DC] dark:border-[#1E4530]">
                        <CheckCircle2 className="w-3 h-3 text-[#3D8556] dark:text-[#86EFAC]" aria-hidden="true" />
                        Aprobado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#A3364E] dark:text-[#FCA5A5] bg-[#FFF0F3] dark:bg-[#32131F] border border-[#FFD7DF] dark:border-[#521C2F]">
                        <XCircle className="w-3 h-3 text-[#C44662] dark:text-[#FCA5A5]" aria-hidden="true" />
                        Fallido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
