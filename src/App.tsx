/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Database, User, UserRole } from './types';
import { loadDB, LOGO_URL } from './lib/db';
import { Header } from './components/Header';
import { PatientView } from './components/PatientView';
import { PsychologistView } from './components/PsychologistView';
import { AuthModal } from './components/AuthModal';
import { TestPlanView } from './components/TestPlanView';
import { motion } from 'motion/react';
import {
  UserCircle2,
  Stethoscope,
  Sparkles,
  ArrowRight,
  LifeBuoy,
  Heart
} from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<Database>(() => loadDB());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authRoleChoice, setAuthRoleChoice] = useState<UserRole>('Paciente');

  // Dark mode state: default to localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('felto_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Keep <html> element and localStorage in sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('felto_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('felto_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Sync hash with test suite if opened
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#pruebas') {
        setCurrentTab('pruebas');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setCurrentTab('inicio');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('inicio');
  };

  const handleOpenAuth = (role: UserRole = 'Paciente') => {
    setAuthRoleChoice(role);
    setShowAuthModal(true);
  };

  const handleUpdateDB = () => {
    setDb({ ...loadDB() });
  };

  const unattendedAlertsCount = currentUser?.rol === 'Psicólogo'
    ? (db.reportesClinicos || []).filter(r => r.psicologoId === currentUser.id && !r.atendido && r.nivelGravedad === 'Alta').length
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0C111D] text-[#2D2938] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-300 selection:bg-[#EAE1FD] dark:selection:bg-[#342459] selection:text-[#583E9E] dark:selection:text-[#DDD6FE]">
      
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        currentTab={currentTab}
        onTabChange={tab => {
          setCurrentTab(tab);
          if (tab === 'pruebas') {
            window.location.hash = 'pruebas';
          } else if (window.location.hash === '#pruebas') {
            window.location.hash = '';
          }
        }}
        onLogout={handleLogout}
        onOpenAuth={() => handleOpenAuth('Paciente')}
        unattendedAlertsCount={unattendedAlertsCount}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {currentTab === 'pruebas' ? (
          <TestPlanView
            onBack={() => {
              setCurrentTab('inicio');
              window.location.hash = '';
            }}
          />
        ) : currentUser?.rol === 'Psicólogo' ? (
          <PsychologistView
            user={currentUser}
            db={db}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
            onUpdateDB={handleUpdateDB}
          />
        ) : currentUser?.rol === 'Paciente' ? (
          <PatientView
            user={currentUser}
            db={db}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
            onUpdateDB={handleUpdateDB}
          />
        ) : (
          /* Sweet, Serene, Minimalist Welcome Screen */
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            
            {/* Hero Section with Cute Puppy Logo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-2xl mx-auto mb-14"
            >
              {/* Puppy Mascot in soft circle */}
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-white border-4 border-[#EADDFE] dark:border-[#C4B5FD] shadow-md dark:shadow-[0_0_25px_rgba(196,181,253,0.35)] flex items-center justify-center p-2 mx-auto overflow-hidden transition-transform hover:scale-105 duration-300">
                  <img
                    src={LOGO_URL}
                    alt="Felt.O Cachorro"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#EDF9F0] dark:bg-[#122A1C] text-[#2C693E] dark:text-[#86EFAC] border border-[#D4F2DC] dark:border-[#1E432E] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <span>🐾</span> Felt.O
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2D2938] dark:text-[#F1F5F9] leading-tight">
                Un rincón suave y tranquilo para cuidar de ti
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#6E6779] dark:text-[#94A3B8] font-normal leading-relaxed">
                Felt.O es tu compañero tierno de apoyo emocional y psicología clínica, diseñado con tonos relajantes,
                respeto empático y herramientas amables para tus días.
              </p>

              {/* Primary Call to Action Cards in Pastel/Midnight with Calm Fade-in & Subtle Slide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
                
                {/* Patient Portal Card */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleOpenAuth('Paciente')}
                  className="group p-6 bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] hover:border-[#D8C7F7] dark:hover:border-[#8C71D6] rounded-3xl cursor-pointer transition-colors shadow-xs hover:shadow-md hover:bg-[#FFFEFC] dark:hover:bg-[#161F36]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F3EFFF] dark:bg-[#271F42] text-[#8C71D6] dark:text-[#C4B5FD] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#EADDFE] dark:border-[#43356E]">
                    <UserCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-[#2D2938] dark:text-[#F1F5F9] flex items-center justify-between">
                    <span>Ingresar como Paciente</span>
                    <ArrowRight className="w-4 h-4 text-[#8C71D6] dark:text-[#C4B5FD] group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-xs text-[#746E80] dark:text-[#94A3B8] mt-2 leading-relaxed">
                    Registra tu diario anímico con colores suaves, platica con Felt.O en el chat con contención y practica respiración guiada 4-4-6.
                  </p>
                </motion.div>

                {/* Psychologist Portal Card */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleOpenAuth('Psicólogo')}
                  className="group p-6 bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] hover:border-[#BEE8C7] dark:hover:border-[#3D8556] rounded-3xl cursor-pointer transition-colors shadow-xs hover:shadow-md hover:bg-[#FFFEFC] dark:hover:bg-[#161F36]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF9F0] dark:bg-[#122A1C] text-[#3D8556] dark:text-[#86EFAC] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#D4F2DC] dark:border-[#1E432E]">
                    <Stethoscope className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-[#2D2938] dark:text-[#F1F5F9] flex items-center justify-between">
                    <span>Panel para Psicólogos</span>
                    <ArrowRight className="w-4 h-4 text-[#3D8556] dark:text-[#86EFAC] group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-xs text-[#746E80] dark:text-[#94A3B8] mt-2 leading-relaxed">
                    Supervisa alertas clínicas en tiempo real con notificaciones nativas, genera reportes mensuales y gestiona tu consultorio.
                  </p>
                </motion.div>

              </div>

              {/* Fast Demo login links in pastel buttons */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[#7A7485] dark:text-[#94A3B8]"
              >
                <span>Prueba inmediata:</span>
                <button
                  type="button"
                  onClick={() => {
                    const pac = db.users.find(u => u.id === 2);
                    if (pac) setCurrentUser(pac);
                  }}
                  className="font-semibold text-[#8C71D6] dark:text-[#C4B5FD] bg-[#F3EFFF] dark:bg-[#271F42] px-3 py-1 rounded-full border border-[#EADDFE] dark:border-[#43356E] hover:bg-[#EAE1FD] dark:hover:bg-[#342857] transition-all hover:scale-102"
                >
                  Entrar como Paciente Demo 🐾
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const psi = db.users.find(u => u.id === 1);
                    if (psi) setCurrentUser(psi);
                  }}
                  className="font-semibold text-[#3D8556] dark:text-[#86EFAC] bg-[#EDF9F0] dark:bg-[#122A1C] px-3 py-1 rounded-full border border-[#D4F2DC] dark:border-[#1E432E] hover:bg-[#DCF3E3] dark:hover:bg-[#1A3B28] transition-all hover:scale-102"
                >
                  Entrar como Psicólogo Demo 🩺
                </button>
              </motion.div>
            </motion.div>

            {/* Evidence & Technical Rigor Section */}
            <div className="border-t border-[#EFEAE1] dark:border-[#1E293B] pt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] dark:bg-[#2A1B14] border border-[#FFE3CC] dark:border-[#4E2B1E] flex items-center justify-center mb-3.5 text-[#D97D45] dark:text-[#FED7AA]">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938] dark:text-[#F1F5F9]">
                    Modo Claro &amp; Nocturno Relajante
                  </h3>
                  <p className="text-xs text-[#6E6779] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    Diseñado con tonos pasteles suaves para el día y azul medianoche con lavanda profunda para la noche, cuidando tus ojos con alto contraste y calma visual.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F0F5FD] dark:bg-[#122238] border border-[#DBE6F8] dark:border-[#1C3B62] flex items-center justify-center mb-3.5 text-[#5C8FD4] dark:text-[#BAE6FD]">
                    <Heart className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938] dark:text-[#F1F5F9]">
                    Chat Empático y Triage Inmediato
                  </h3>
                  <p className="text-xs text-[#6E6779] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    Conversaciones empáticas con respuesta en 0ms y contención inmediata en casos de riesgo grave (gravedad 4-5) con notificación nativa a psicólogos.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EDF9F0] dark:bg-[#122A1C] border border-[#D4F2DC] dark:border-[#1E432E] flex items-center justify-center mb-3.5 text-[#4E9B66] dark:text-[#86EFAC]">
                    <LifeBuoy className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938] dark:text-[#F1F5F9]">
                    Plan de Pruebas Unitarias
                  </h3>
                  <p className="text-xs text-[#6E6779] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    Casos de prueba automatizados (PU01 a PU06) ejecutables en vivo para verificar la seguridad técnica y clínica del sistema.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('pruebas');
                      window.location.hash = 'pruebas';
                    }}
                    className="mt-3 text-xs font-bold text-[#8C71D6] dark:text-[#C4B5FD] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver resultados de pruebas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>

              </div>
            </div>

          </main>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          db={db}
          initialRole={authRoleChoice}
          onSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Ethical & Accessible Clinical Disclaimer Footer */}
      <footer className="border-t border-[#EFEAE1] dark:border-[#1E293B] bg-white/70 dark:bg-[#0B0F19]/90 py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#868091] dark:text-[#94A3B8] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden p-0.5 border border-[#EADDFE] dark:border-[#C4B5FD] bg-white dark:bg-white shadow-xs">
              <img src={LOGO_URL} alt="Felt.O" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[#2D2938] dark:text-[#F1F5F9]">Felt.O</span>
            <span>·</span>
            <span>Apoyo Emocional Dulce &amp; Psicología Clínica</span>
          </div>
          
          <div className="text-center md:text-right text-[11px] max-w-xl text-[#8E8799] dark:text-[#64748B]">
            Aviso ético: Felt.O no sustituye la consulta médica presencial ni la atención psiquiátrica de urgencia.
            En caso de emergencia severa, acude inmediatamente a los servicios de salud de tu localidad.
          </div>
        </div>
      </footer>

    </div>
  );
}
