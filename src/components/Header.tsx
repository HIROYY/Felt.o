/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, Sparkles, ShieldAlert, CreditCard, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { LOGO_URL } from '../lib/db';

interface HeaderProps {
  currentUser: User | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  unattendedAlertsCount?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentTab,
  onTabChange,
  onLogout,
  onOpenAuth,
  unattendedAlertsCount = 0,
  isDarkMode,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFFDF9]/95 dark:bg-[#0C111D]/95 backdrop-blur-md border-b border-[#EFEAE1] dark:border-[#1E293B] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Zone 1: Brand Wordmark with Puppy Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('inicio')}
            className="flex items-center gap-2.5 text-left focus-visible:ring-2 focus-visible:ring-[#8C71D6] rounded-xl p-1 hover:bg-[#F7F2EB] dark:hover:bg-[#161F36] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-white border-2 border-[#EADDFE] dark:border-[#C4B5FD] shadow-xs dark:shadow-[0_0_15px_rgba(196,181,253,0.3)] flex items-center justify-center overflow-hidden p-1">
              <img
                src={LOGO_URL}
                alt="Logo Felt.O"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#2D2938] dark:text-[#F1F5F9] whitespace-nowrap leading-tight">
                  Felt.O
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F3EFFF] dark:bg-[#271F42] text-[#7C5FD1] dark:text-[#C4B5FD] border border-[#E7DCFE] dark:border-[#43356E] font-semibold">
                  Bienestar 🐾
                </span>
              </div>
              <span className="text-[11px] text-[#7E7788] dark:text-[#94A3B8] block leading-tight">
                Apoyo Emocional Dulce
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-[#6B6576] dark:text-[#94A3B8]">
          {currentUser?.rol === 'Psicólogo' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'inicio'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Panel Clínico
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pacs')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'pacs'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Pacientes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('alertas')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'alertas'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#B8445E] dark:text-[#F472B6]" aria-hidden="true" />
                <span>Alertas IA</span>
                {unattendedAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF0F3] dark:bg-[#3D1422] text-[#B8445E] dark:text-[#FCA5A5] border border-[#FFD7DF] dark:border-[#5C1E32] animate-pulse">
                    {unattendedAlertsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTabChange('rep')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'rep'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Reportes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('suscripcion')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'suscripcion'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#8C71D6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>Suscripción</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'perf'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
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
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Diario Emocional
              </button>
              <button
                type="button"
                onClick={() => onTabChange('chat')}
                className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
                  currentTab === 'chat'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8C71D6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>Chat con Felt.O</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('respirar')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'respirar'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Respiración 4-4-6
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`transition-colors whitespace-nowrap py-1 ${
                  currentTab === 'perf'
                    ? 'text-[#7252C4] dark:text-[#C4B5FD] font-semibold border-b-2 border-[#8C71D6] dark:border-[#A78BFA]'
                    : 'hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                Mi Perfil
              </button>
            </>
          ) : null}
        </nav>

        {/* Zone 3: Actions + Theme Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* Relaxing Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? 'Cambiar a modo claro y suave' : 'Cambiar a modo nocturno relajante'}
            title={isDarkMode ? 'Activar modo claro' : 'Activar modo nocturno relajante'}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E8E2D8] dark:border-[#232B45] bg-[#FAF6EE] dark:bg-[#161F36] text-[#6D6778] dark:text-[#C4B5FD] hover:text-[#2D2938] dark:hover:text-white hover:bg-[#F2ECE1] dark:hover:bg-[#202B4B] transition-all focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[#FDE68A] transition-transform duration-300 rotate-0 hover:rotate-45" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[#6D54A8] transition-transform duration-300 -rotate-12 hover:rotate-0" aria-hidden="true" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-[#2D2938] dark:text-[#F1F5F9] block leading-tight">
                  {currentUser.nombre}
                </span>
                <span className="text-[11px] text-[#7E7788] dark:text-[#94A3B8] block leading-tight">
                  {currentUser.rol}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Cerrar sesión"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5E5868] dark:text-[#CBD5E1] hover:text-[#2D2938] dark:hover:text-white hover:bg-[#F4EFEA] dark:hover:bg-[#1E293B] border border-[#E8E2D8] dark:border-[#334155] rounded-xl transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] dark:bg-[#7C5FD1] dark:hover:bg-[#6C4EB8] rounded-xl transition-all shadow-xs"
            >
              Iniciar Sesión
            </button>
          )}
        </div>

      </div>

      {/* Mobile Navigation Strip */}
      {currentUser && (
        <div className="md:hidden border-t border-[#EFEAE1] dark:border-[#1E293B] px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto text-xs font-medium bg-[#FFFDF9] dark:bg-[#0C111D]">
          {currentUser.rol === 'Psicólogo' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'inicio' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Panel
              </button>
              <button
                type="button"
                onClick={() => onTabChange('alertas')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1 ${currentTab === 'alertas' ? 'bg-[#FFF0F3] dark:bg-[#3D1422] text-[#B8445E] dark:text-[#FCA5A5] font-semibold border border-[#FFD7DF] dark:border-[#5C1E32]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                <span>Alertas IA</span>
                {unattendedAlertsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#B8445E] dark:bg-[#F472B6]"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pacs')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'pacs' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Pacientes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('rep')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'rep' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Reportes
              </button>
              <button
                type="button"
                onClick={() => onTabChange('suscripcion')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'suscripcion' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Suscripción
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'perf' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Perfil
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'inicio' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Diario
              </button>
              <button
                type="button"
                onClick={() => onTabChange('chat')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'chat' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Chat 🐾
              </button>
              <button
                type="button"
                onClick={() => onTabChange('respirar')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'respirar' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Respirar
              </button>
              <button
                type="button"
                onClick={() => onTabChange('perf')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap ${currentTab === 'perf' ? 'bg-[#F3EFFF] dark:bg-[#271F42] text-[#7252C4] dark:text-[#C4B5FD] font-semibold border border-[#E7DCFE] dark:border-[#3F3169]' : 'text-[#6B6576] dark:text-[#94A3B8]'}`}
              >
                Perfil
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

