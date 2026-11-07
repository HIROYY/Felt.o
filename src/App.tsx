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
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2938] flex flex-col font-sans selection:bg-[#EAE1FD] selection:text-[#583E9E]">
      
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
            <div className="text-center max-w-2xl mx-auto mb-14">
              {/* Puppy Mascot in soft pastel circle */}
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-[#EADDFE] shadow-sm flex items-center justify-center p-1.5 mx-auto overflow-hidden">
                  <img
                    src={LOGO_URL}
                    alt="Felt.O Cachorro"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <span>🐾</span> Felt.O
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2D2938] leading-tight">
                Un rincón suave y tranquilo para cuidar de ti
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#6E6779] font-normal leading-relaxed">
                Felt.O es tu compañero tierno de apoyo emocional y psicología clínica, diseñado con tonos pasteles
                suaves, respeto empático y herramientas amables para tus días.
              </p>

              {/* Primary Call to Action Cards in Pastel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
                
                {/* Patient Portal Card */}
                <div
                  onClick={() => handleOpenAuth('Paciente')}
                  className="group p-6 bg-white border border-[#EFEAE1] hover:border-[#D8C7F7] rounded-3xl cursor-pointer transition-all shadow-xs hover:shadow-md hover:bg-[#FFFEFC]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F3EFFF] text-[#8C71D6] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#EADDFE]">
                    <UserCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-[#2D2938] flex items-center justify-between">
                    <span>Ingresar como Paciente</span>
                    <ArrowRight className="w-4 h-4 text-[#8C71D6] group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-xs text-[#746E80] mt-2 leading-relaxed">
                    Registra tu diario anímico en tonos pastel, platica con Felt.O en el chat y practica respiración guiada 4-4-6.
                  </p>
                </div>

                {/* Psychologist Portal Card */}
                <div
                  onClick={() => handleOpenAuth('Psicólogo')}
                  className="group p-6 bg-white border border-[#EFEAE1] hover:border-[#BEE8C7] rounded-3xl cursor-pointer transition-all shadow-xs hover:shadow-md hover:bg-[#FFFEFC]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF9F0] text-[#3D8556] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#D4F2DC]">
                    <Stethoscope className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-base font-bold text-[#2D2938] flex items-center justify-between">
                    <span>Panel para Psicólogos</span>
                    <ArrowRight className="w-4 h-4 text-[#3D8556] group-hover:translate-x-1 transition-transform" />
                  </h2>
                  <p className="text-xs text-[#746E80] mt-2 leading-relaxed">
                    Supervisa alertas clínicas de riesgo, genera reportes mensuales y vincula pacientes con tu código médico.
                  </p>
                </div>

              </div>

              {/* Fast Demo login links in pastel buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[#7A7485]">
                <span>Prueba inmediata:</span>
                <button
                  type="button"
                  onClick={() => {
                    const pac = db.users.find(u => u.id === 2);
                    if (pac) setCurrentUser(pac);
                  }}
                  className="font-semibold text-[#8C71D6] bg-[#F3EFFF] px-3 py-1 rounded-full border border-[#EADDFE] hover:bg-[#EAE1FD] transition-colors"
                >
                  Entrar como Paciente Demo 🐾
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const psi = db.users.find(u => u.id === 1);
                    if (psi) setCurrentUser(psi);
                  }}
                  className="font-semibold text-[#3D8556] bg-[#EDF9F0] px-3 py-1 rounded-full border border-[#D4F2DC] hover:bg-[#DCF3E3] transition-colors"
                >
                  Entrar como Psicólogo Demo 🩺
                </button>
              </div>
            </div>

            {/* Evidence & Technical Rigor Section */}
            <div className="border-t border-[#EFEAE1] pt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 rounded-3xl bg-white border border-[#EFEAE1] shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF4EB] border border-[#FFE3CC] flex items-center justify-center mb-3.5 text-[#D97D45]">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938]">
                    Colores Pasteles Claros y Lindos
                  </h3>
                  <p className="text-xs text-[#6E6779] mt-1.5 leading-relaxed">
                    Una paleta relajante en tonos vainilla, lavanda, menta, durazno y rosa suave que descansa la vista y transmite serenidad.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-[#EFEAE1] shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#F0F5FD] border border-[#DBE6F8] flex items-center justify-center mb-3.5 text-[#5C8FD4]">
                    <Heart className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938]">
                    Chat empático con Felt.O
                  </h3>
                  <p className="text-xs text-[#6E6779] mt-1.5 leading-relaxed">
                    Conversaciones respetuosas y cálidas con el cachorro Felt.O para expresar lo que sientes y recibir contención al instante.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-[#EFEAE1] shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#EDF9F0] border border-[#D4F2DC] flex items-center justify-center mb-3.5 text-[#4E9B66]">
                    <LifeBuoy className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2938]">
                    Plan de Pruebas Unitarias
                  </h3>
                  <p className="text-xs text-[#6E6779] mt-1.5 leading-relaxed">
                    Casos de prueba automatizados (PU01 a PU06) ejecutables en vivo para verificar la seguridad técnica y clínica del sistema.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('pruebas');
                      window.location.hash = 'pruebas';
                    }}
                    className="mt-3 text-xs font-bold text-[#8C71D6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ver resultados de pruebas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

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
      <footer className="border-t border-[#EFEAE1] bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#868091] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden p-0.5 border border-[#EADDFE] bg-white">
              <img src={LOGO_URL} alt="Felt.O" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[#2D2938]">Felt.O</span>
            <span>·</span>
            <span>Apoyo Emocional Dulce &amp; Psicología Clínica</span>
          </div>
          
          <div className="text-center md:text-right text-[11px] max-w-xl text-[#8E8799]">
            Aviso ético: Felt.O no sustituye la consulta médica presencial ni la atención psiquiátrica de urgencia.
            En caso de emergencia severa, acude inmediatamente a los servicios de salud de tu localidad.
          </div>
        </div>
      </footer>

    </div>
  );
}
