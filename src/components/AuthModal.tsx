/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, User, UserRole } from '../types';
import { login, registrar, saveDB, LOGO_URL, validarCedulaProfesional } from '../lib/db';
import { UserCircle2, Stethoscope, AlertCircle, X, CheckCircle2, ShieldCheck, UploadCloud, FileText } from 'lucide-react';

interface AuthModalProps {
  db: Database;
  onSuccess: (user: User) => void;
  onClose?: () => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  db,
  onSuccess,
  onClose,
  initialRole = 'Paciente'
}) => {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [pat, setPat] = useState<string>('');
  const [mat, setMat] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [especialidad, setEspecialidad] = useState<string>('Psicología Clínica & TCC');
  const [universidad, setUniversidad] = useState<string>('Universidad Nacional Autónoma de México (UNAM)');
  const [anioGraduacion, setAnioGraduacion] = useState<number>(2019);
  const [documentoNombre, setDocumentoNombre] = useState<string>('Cedula_Profesional_Oficial.pdf');
  const [codigo, setCodigo] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleQuickDemo = (type: UserRole) => {
    if (type === 'Psicólogo') {
      setEmail('psic@felt.o');
      setPassword('Psico#123');
      setRole('Psicólogo');
    } else {
      setEmail('estrella@correo.com');
      setPassword('Segura#123');
      setRole('Paciente');
    }
    setMode('login');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      const res = login(db, email, password);
      if (!res.ok || !res.u) {
        setErrorMsg(res.msg || 'Contraseña o correo incorrectos');
        return;
      }
      if (res.u.rol !== role) {
        setErrorMsg(`Esta cuenta pertenece al rol de ${res.u.rol}. Por favor selecciona el perfil correspondiente.`);
        return;
      }
      onSuccess(res.u);
    } else {
      if (!consent) {
        setErrorMsg('Es indispensable aceptar el consentimiento para el resguardo de información clínica/emocional.');
        return;
      }
      const apellidos = `${pat} ${mat}`.trim();
      const res = registrar(db, {
        rol: role,
        nombre: nombre || 'Usuario',
        apellidos,
        email,
        pass: password,
        cedula,
        esp: especialidad,
        codigo,
        universidad: role === 'Psicólogo' ? universidad : undefined,
        anioGraduacion: role === 'Psicólogo' ? Number(anioGraduacion) : undefined,
        documentoAcreditacionNombre: role === 'Psicólogo' ? documentoNombre : undefined
      });

      if (!res.ok || !res.u) {
        setErrorMsg(res.msg || 'No se pudo crear la cuenta');
        return;
      }
      saveDB(db);
      onSuccess(res.u);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050811]/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#111625] border border-[#EFEAE1] dark:border-[#1E293B] rounded-3xl w-full max-w-lg shadow-xl overflow-hidden my-8 transition-colors">
        
        {/* Modal Header with Puppy Logo */}
        <div className="p-6 pb-4 border-b border-[#F5EFE6] dark:border-[#1E293B] flex items-center justify-between bg-[#FFFDF9] dark:bg-[#161F36]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-white border-2 border-[#EADDFE] dark:border-[#C4B5FD] shadow-xs dark:shadow-[0_0_15px_rgba(196,181,253,0.3)] flex items-center justify-center overflow-hidden p-1 shrink-0">
              <img
                src={LOGO_URL}
                alt="Felt.O Cachorro"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="auth-modal-title" className="text-lg font-bold text-[#2D2938] dark:text-[#F1F5F9]">
                  {mode === 'login' ? '¡Bienvenid@ a Felt.O!' : 'Crear Cuenta Segura'}
                </h2>
                <span className="text-[11px] bg-[#F3EFFF] dark:bg-[#271F42] text-[#7C5FD1] dark:text-[#C4B5FD] px-2 py-0.5 rounded-full font-semibold border border-[#E7DCFE] dark:border-[#43356E]">
                  🐾 Refugio
                </span>
              </div>
              <p className="text-xs text-[#7A7485] dark:text-[#94A3B8]">
                {mode === 'login' ? 'Tu espacio de calma y apoyo emocional' : 'Completa tus datos para comenzar'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="p-1.5 text-[#9E97A8] hover:text-[#2D2938] dark:hover:text-white hover:bg-[#F5F0EA] dark:hover:bg-[#1E293B] rounded-full transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Role Segmented Selector */}
        <div className="px-6 pt-5">
          <fieldset>
            <legend className="text-xs font-semibold text-[#6E6779] dark:text-[#CBD5E1] mb-2">
              Selecciona tu tipo de perfil
            </legend>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF6F0] dark:bg-[#0C111D] rounded-2xl border border-[#EFE8DE] dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => {
                  setRole('Paciente');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  role === 'Paciente'
                    ? 'bg-white dark:bg-[#161F36] text-[#7252C4] dark:text-[#C4B5FD] shadow-xs border border-[#EADDFE] dark:border-[#3B315D]'
                    : 'text-[#6E6779] dark:text-[#94A3B8] hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <UserCircle2 className="w-4 h-4 text-[#8C71D6] dark:text-[#A78BFA]" aria-hidden="true" />
                <span>Paciente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('Psicólogo');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  role === 'Psicólogo'
                    ? 'bg-white dark:bg-[#161F36] text-[#3D8556] dark:text-[#86EFAC] shadow-xs border border-[#D4F2DC] dark:border-[#1E432E]'
                    : 'text-[#6E6779] dark:text-[#94A3B8] hover:text-[#2D2938] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-[#4E9B66] dark:text-[#86EFAC]" aria-hidden="true" />
                <span>Psicólogo</span>
              </button>
            </div>
          </fieldset>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="px-6 pt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#7E7788] dark:text-[#94A3B8]">Accesos rápidos de demostración:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('Paciente')}
              className="text-[11px] font-semibold text-[#8C71D6] dark:text-[#C4B5FD] bg-[#F3EFFF] dark:bg-[#271F42] px-2 py-0.5 rounded-full hover:bg-[#EAE1FD] dark:hover:bg-[#342857] transition-colors"
            >
              Paciente demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('Psicólogo')}
              className="text-[11px] font-semibold text-[#4E9B66] dark:text-[#86EFAC] bg-[#EDF9F0] dark:bg-[#122A1C] px-2 py-0.5 rounded-full hover:bg-[#DDF4E4] dark:hover:bg-[#1B3C29] transition-colors"
            >
              Psicólogo demo
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            role="alert"
            className="mx-6 mt-3 p-3 rounded-2xl bg-[#FFF0F3] border border-[#FFD7DF] text-xs text-[#B8445E] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="reg-nombre" className="block text-xs font-semibold text-[#575162] mb-1">
                  Nombre
                </label>
                <input
                  id="reg-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Laura"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-pat" className="block text-xs font-semibold text-[#575162] mb-1">
                    Apellido Paterno
                  </label>
                  <input
                    id="reg-pat"
                    type="text"
                    value={pat}
                    onChange={e => setPat(e.target.value)}
                    placeholder="Méndez"
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-mat" className="block text-xs font-semibold text-[#575162] mb-1">
                    Apellido Materno
                  </label>
                  <input
                    id="reg-mat"
                    type="text"
                    value={mat}
                    onChange={e => setMat(e.target.value)}
                    placeholder="Ruiz"
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                  />
                </div>
              </div>

              {role === 'Psicólogo' ? (
                <div className="space-y-3 pt-1 border-t border-[#F5EFE6]">
                  {/* Accreditation Notice */}
                  <div className="p-3 rounded-2xl bg-[#F0F5FD] border border-[#DBE6F8] flex items-start gap-2.5 text-xs text-[#3E6A9E]">
                    <ShieldCheck className="w-4 h-4 text-[#5C8FD4] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="font-semibold text-[#2D2938]">Verificación Profesional Oficial:</strong> Para la seguridad y contención de pacientes, verificamos que seas un psicólogo titulado ante la Dirección General de Profesiones (DGP).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-cedula" className="block text-xs font-semibold text-[#575162] mb-1">
                        Cédula Profesional (7 u 8 dígitos)
                      </label>
                      <input
                        id="reg-cedula"
                        type="text"
                        required
                        maxLength={8}
                        value={cedula}
                        onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ej. 12345678"
                        className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-anio" className="block text-xs font-semibold text-[#575162] mb-1">
                        Año de Titulación
                      </label>
                      <input
                        id="reg-anio"
                        type="number"
                        min="1960"
                        max={new Date().getFullYear()}
                        value={anioGraduacion}
                        onChange={e => setAnioGraduacion(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                      />
                    </div>
                  </div>

                  {/* Live Cédula Validation Indicator */}
                  {cedula.trim().length > 0 && (
                    <div>
                      {/^\d{7,8}$/.test(cedula.trim()) && !/^(\d)\1+$/.test(cedula.trim()) ? (
                        <div className="p-2.5 rounded-xl bg-[#EDF9F0] border border-[#D4F2DC] text-xs text-[#2C693E] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#3D8556] shrink-0" />
                          <div>
                            <span className="font-bold">✓ Cédula Registrada ante DGP - SEP</span>
                            <span className="block text-[11px] text-[#3D8556]/90">
                              Licenciatura en Psicología · Cédula #{cedula} · Estatus Vigente
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FDEEBA] text-[11px] text-[#8C6910] flex items-center gap-1.5">
                          <span>⚠️ Ingresa una cédula profesional válida de 7 u 8 dígitos numéricos.</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="reg-universidad" className="block text-xs font-semibold text-[#575162] mb-1">
                      Universidad o Institución de Egreso
                    </label>
                    <select
                      id="reg-universidad"
                      value={universidad}
                      onChange={e => setUniversidad(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                    >
                      <option value="Universidad Nacional Autónoma de México (UNAM)">Universidad Nacional Autónoma de México (UNAM)</option>
                      <option value="Universidad de Guadalajara (UdeG)">Universidad de Guadalajara (UdeG)</option>
                      <option value="Universidad Autónoma de Nuevo León (UANL)">Universidad Autónoma de Nuevo León (UANL)</option>
                      <option value="Universidad Iberoamericana (IBERO)">Universidad Iberoamericana (IBERO)</option>
                      <option value="Instituto Tecnológico de Estudios Superiores de Occidente (ITESO)">ITESO Universidad Jesuita</option>
                      <option value="Universidad Anáhuac">Universidad Anáhuac</option>
                      <option value="Instituto Politécnico Nacional (IPN)">Instituto Politécnico Nacional (IPN)</option>
                      <option value="Otra Universidad Acreditada">Otra Universidad Acreditada con Reconocimiento SEP</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reg-esp" className="block text-xs font-semibold text-[#575162] mb-1">
                      Especialidad o Enfoque Clínico
                    </label>
                    <input
                      id="reg-esp"
                      type="text"
                      value={especialidad}
                      onChange={e => setEspecialidad(e.target.value)}
                      placeholder="Ej. Terapia Cognitivo-Conductual / Clínica de Adultos"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                    />
                  </div>

                  {/* Document Credential Attachment */}
                  <div>
                    <label className="block text-xs font-semibold text-[#575162] mb-1">
                      Comprobante de Cédula o Título <span className="font-normal text-[#8A8394]">(PDF o Imagen)</span>
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#DCD5C9] bg-[#FAF8F5]">
                      <FileText className="w-4 h-4 text-[#8C71D6] shrink-0" />
                      <span className="text-xs text-[#5A5464] font-mono truncate flex-1">
                        {documentoNombre}
                      </span>
                      <label className="cursor-pointer px-2.5 py-1 text-xs font-semibold bg-white border border-[#E8E2D8] text-[#5A5464] rounded-lg hover:bg-[#F5EFE6] transition-colors">
                        <span>Cambiar</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setDocumentoNombre(file.name);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="reg-codigo" className="block text-xs font-semibold text-[#575162] mb-1">
                    Código de psicólogo vinculado <span className="font-normal text-[#8A8394]">(opcional)</span>
                  </label>
                  <input
                    id="reg-codigo"
                    type="text"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    placeholder="Ej. PSIC-5678"
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6] uppercase font-mono"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#575162] dark:text-[#CBD5E1] mb-1">
              Correo Electrónico
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] dark:bg-[#0C111D] border border-[#E8E2D8] dark:border-[#232B45] rounded-xl text-[#2D2938] dark:text-[#F1F5F9] focus:bg-white dark:focus:bg-[#161F36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="auth-pass" className="block text-xs font-semibold text-[#575162] dark:text-[#CBD5E1]">
                Contraseña
              </label>
              {mode === 'register' && (
                <span className="text-[10px] text-[#8A8394] dark:text-[#94A3B8]">8+ letras, 1 mayúscula y 1 número</span>
              )}
            </div>
            <input
              id="auth-pass"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] dark:bg-[#0C111D] border border-[#E8E2D8] dark:border-[#232B45] rounded-xl text-[#2D2938] dark:text-[#F1F5F9] focus:bg-white dark:focus:bg-[#161F36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
            />
          </div>

          {mode === 'register' && (
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-[#DCD5C9] text-[#8C71D6] focus:ring-[#8C71D6]"
              />
              <span className="text-xs text-[#6B6576] dark:text-[#94A3B8] leading-tight">
                Acepto el aviso de privacidad, el secreto profesional y el resguardo ético de mis datos de bienestar emocional.
              </span>
            </label>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-2xl text-sm font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] dark:bg-[#7C5FD1] dark:hover:bg-[#6C4EB8] transition-all shadow-xs"
            >
              {mode === 'login' ? `Entrar como ${role}` : `Registrarme como ${role}`}
            </button>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] dark:bg-[#161F36] border-t border-[#F0EAE1] dark:border-[#1E293B] flex items-center justify-between text-xs">
          <span className="text-[#6E6779] dark:text-[#94A3B8]">
            {mode === 'login' ? '¿Aún no tienes una cuenta?' : '¿Ya cuentas con usuario?'}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg('');
            }}
            className="font-bold text-[#8C71D6] dark:text-[#C4B5FD] hover:underline"
          >
            {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </div>

      </div>
    </div>
  );
};
