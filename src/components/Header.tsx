/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, FileCheck, Sparkles, ShieldAlert, CreditCard } from 'lucide-react';
import { User } from '../types';
import { LOGO_URL } from '../lib/db';

interface HeaderProps {
  currentUser: User | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  unattendedAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentTab,
  onTabChange,
  onLogout,
  onOpenAuth,
  unattendedAlertsCount = 0
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#EFEAE1] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* Zone 1: Brand Wordmark with Puppy Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('inicio')}
            className="flex items-center gap-2.5 text-left focus-visible:ring-2 focus-visible:ring-[#8C71D6] rounded-xl p-1 hover:bg-[#F7F2EB] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#EADDFE] shadow-xs flex items-center justify-center overflow-hidden p-0.5">
              <img
                src={LOGO_URL}
                alt="Logo Felt.O"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#2D2938] whitespace-nowrap leading-tight">
                  Felt.O
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F3EFFF] text-[#7C5FD1] border border-[#E7DCFE] font-semibold">
                  Bienestar 🐾
                </span>
              </div>
              <span className="text-[11px] text-[#7E7788] block leading-tight">
                Apoyo Emocional Dulce
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean, Light Pastel) */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B6576]">
          {currentUser?.rol === 'Psicólogo' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'inicio'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Panel Clínico
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pacs')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'pacs'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Pacientes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('alertas')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'alertas'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#B8445E]" aria-hidden="true" />
                <span>Alertas IA</span>
                {unattendedAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF0F3] text-[#B8445E] border border-[#FFD7DF] animate-pulse">
                    {unattendedAlertsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTabChange('rep')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'rep'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Reportes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('suscripcion')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'suscripcion'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#8C71D6]" aria-hidden="true" />
                <span>Suscripción</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'perf'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Mi Perfil
              </button>
            </>
          ) : currentUser?.rol === 'Paciente' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'inicio'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Diario Emocional
              </button>
              <button
                type="button"
                onClick={() => onTabChange('chat')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'chat'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C71D6]" aria-hidden="true" />
                <span>Chat con Felt.O</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('respirar')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'respirar'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Respiración 4-4-6
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'perf'
                    ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                    : 'hover:text-[#2D2938]'
                }`}
              >
                Mi Perfil
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => onTabChange('pruebas')}
            className={`transition-colors flex items-center gap-1.5 whitespace-nowrap py-1 ${
              currentTab === 'pruebas'
                ? 'text-[#7252C4] font-semibold border-b-2 border-[#8C71D6]'
                : 'hover:text-[#2D2938] text-[#868091]'
            }`}
          >
            <FileCheck className="w-4 h-4" aria-hidden="true" />
            <span>Plan de Pruebas</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-[#2D2938] block leading-tight">
                  {currentUser.nombre}
                </span>
                <span className="text-[11px] text-[#7E7788] block leading-tight">
                  {currentUser.rol}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Cerrar sesión"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5E5868] hover:text-[#2D2938] hover:bg-[#F4EFEA] border border-[#E8E2D8] rounded-xl transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-xl transition-all shadow-xs"
            >
              Iniciar Sesión
            </button>
          )}
        </div>

      </div>

      {/* Mobile Navigation Strip */}
      {currentUser && (
        <div className="md:hidden border-t border-[#EFEAE1] px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto text-xs font-medium bg-[#FFFDF9]">
          {currentUser.rol === 'Psicólogo' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'inicio' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Panel
              </button>
              <button
                type="button"
                onClick={() => onTabChange('alertas')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 ${currentTab === 'alertas' ? 'bg-[#FFF0F3] text-[#B8445E] font-semibold border border-[#FFD7DF]' : 'text-[#6B6576]'}`}
              >
                <span>Alertas IA</span>
                {unattendedAlertsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#B8445E]"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pacs')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'pacs' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Pacientes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('rep')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'rep' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Reportes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('suscripcion')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'suscripcion' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Suscripción
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'perf' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Perfil
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'inicio' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Diario
              </button>
              <button
                type="button"
                onClick={() => onTabChange('chat')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'chat' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Chat 🐾
              </button>
              <button
                type="button"
                onClick={() => onTabChange('respirar')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'respirar' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Respirar
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'perf' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#6B6576]'}`}
              >
                Perfil
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onTabChange('pruebas')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'pruebas' ? 'bg-[#F3EFFF] text-[#7252C4] font-semibold border border-[#E7DCFE]' : 'text-[#868091]'}`}
          >
            Pruebas
          </button>
        </div>
      )}
    </header>
  );
};
