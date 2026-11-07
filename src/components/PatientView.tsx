/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Database, EmotionType, User, ClinicalReport } from '../types';
import {
  EMO_DATA,
  recordatorio,
  regEmo,
  saveDB,
  historial,
  eliminarHistorial,
  now,
  LOGO_URL,
  crearReporteGravedad,
  obtenerReportesPaciente
} from '../lib/db';
import { broadcastCriticalAlert } from '../lib/notifications';
import { BreathingExercise } from './BreathingExercise';
import {
  Calendar,
  Send,
  Sparkles,
  Shield,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  CheckCircle,
  MessageSquare,
  Bot
} from 'lucide-react';

interface PatientViewProps {
  user: User;
  db: Database;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdateDB: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'felto';
  text: string;
  timestamp: number;
}

export const PatientView: React.FC<PatientViewProps> = ({
  user,
  db,
  activeTab,
  onTabChange,
  onUpdateDB
}) => {
  // Quick check-in state
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [trigger, setTrigger] = useState<string>('Rutina diaria');
  const [note, setNote] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ emotion: EmotionType; msg: string; exercise: string } | null>(null);

  // Multi-turn Gemini Chat with Felt.O puppy
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'felto',
      text: `¡Hola ${user.nombre}! 🐾 Soy Felt.O, tu compañero perrito de apoyo emocional. Estoy aquí para escucharte con todo mi cariño, sin prisas ni juicios. ¿Cómo te sientes el día de hoy?`,
      timestamp: Date.now()
    }
  ]);
  const [inputChatText, setInputChatText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [latestReportAlert, setLatestReportAlert] = useState<ClinicalReport | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Psychologist linking state
  const [linkCodeInput, setLinkCodeInput] = useState<string>('');
  const [linkStatusMsg, setLinkStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Deletion confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Filter for history
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  const history = historial(db, user.id);
  const patientReports = obtenerReportesPaciente(db, user.id);
  const showReminder = recordatorio(db, user.id);
  const linkedPsi = db.users.find(u => u.id === user.psic);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Compute emotion breakdown
  const emotionCounts = history.reduce((acc, h) => {
    acc[h.e] = (acc[h.e] || 0) + 1;
    return acc;
  }, {} as Record<EmotionType, number>);

  const handleQuickRegister = (emotion: EmotionType) => {
    const res = regEmo(db, user.id, emotion, intensity, note, now(), trigger);
    if (res.ok) {
      saveDB(db);
      onUpdateDB();
      const meta = EMO_DATA[emotion];
      setFeedbackMsg({
        emotion,
        msg: meta.mensaje,
        exercise: meta.ejercicio
      });
      setNote('');
      setSelectedEmotion(null);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || inputChatText).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setInputChatText('');

    // ZERO-LATENCY CRISIS FAST-PATH (Gravedad 4 y superior: ideación suicida, autolesiones o expresiones límite)
    // Responde instantáneamente en 0ms sin demora de red ni espera al modelo de IA
    const HIGH_CRISIS_REGEX = /(me quiero morir|me quiero suicidar|me quiero eliminar|no quiero vivir|acabar con mi vida|quitarme la vida|deseo morir|quiero morir|quiero desaparecer|hacerme da[ñn]o|matarme|cortarme|no vale la pena vivir|suicidio|no puedo m[aá]s con mi vida|terminar con todo|ya no aguanto m[aá]s|me quiero quitar la vida|no quiero existir)/i;

    if (HIGH_CRISIS_REGEX.test(textToSend)) {
      // 1. Generación inmediata del reporte clínico de Gravedad Alta (puntuación 5/5)
      const immediateReport = crearReporteGravedad(db, {
        pacienteId: user.id,
        pacienteNombre: `${user.nombre} ${user.apellidos}`.trim(),
        psicologoId: user.psic,
        nivelGravedad: 'Alta',
        puntuacionRiesgo: 5,
        emocionDetectada: 'Triste',
        resumenClinico: `ALERTA CRÍTICA INMEDIATA: Paciente manifiesta ideación de alto riesgo ("${textToSend}"). Protocolo de contención inmediata activado sin latencia.`,
        senalesDetectadas: ['Ideación de riesgo inminente', 'Crisis de sobrecarga límite', 'Riesgo vital elevado'],
        recomendacion: 'Protocolo de emergencia: Contactar inmediatamente al paciente y/o a su red de apoyo. Valorar derivación a urgencias psiquiátricas.',
        fragmentoMensaje: textToSend
      });
      saveDB(db);
      onUpdateDB();
      setLatestReportAlert(immediateReport);

      // 2. Notificación nativa inmediata y broadcast en tiempo real a los psicólogos
      broadcastCriticalAlert(immediateReport);

      // 3. Respuesta de contención cálida, tierna e instantánea de Felt.O con números de emergencia
      const immediateReply = `Por favor, detente un segundo y escúchame con todo mi corazón 🐾. Tu vida tiene un valor inmenso y me importas profundamente. Sé que el dolor se siente asfixiante e insoportable en este instante, pero no estás solo/a. He emitido de inmediato una alerta de emergencia al consultorio de tu psicólogo y aquí tienes apoyo directo y gratuito las 24 horas:\n\n• Línea de la Vida (gratuita 24/7): 800 911 2000\n• Emergencias Médicas Inmediatas: 911\n\nQuédate conmigo un momento, respira despacio y permítenos acompañarte. ¿Hay alguien de confianza cerca con quien puedas estar ahora?`;

      setChatMessages(prev => [
        ...prev,
        {
          id: `f-${Date.now()}`,
          sender: 'felto',
          text: immediateReply,
          timestamp: Date.now()
        }
      ]);

      // Sincronizar en segundo plano con el servidor
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user.nombre,
          userEmotion: selectedEmotion || history[0]?.e || 'Triste',
          messages: updatedMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      }).catch(() => {});

      return;
    }

    // Flujo estándar con IA
    setIsChatLoading(true);

    try {
      const payload = {
        userName: user.nombre,
        userEmotion: selectedEmotion || history[0]?.e || 'Tranquilo',
        messages: updatedMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }))
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const reply = data.reply || 'Aquí estoy a tu lado 🐾. Respira con calma y cuenta conmigo.';

      // Process and register AI Clinical Triage Report
      if (data.triage) {
        const newReport = crearReporteGravedad(db, {
          pacienteId: user.id,
          pacienteNombre: `${user.nombre} ${user.apellidos}`.trim(),
          psicologoId: user.psic,
          nivelGravedad: data.triage.nivelGravedad || 'Media',
          puntuacionRiesgo: Number(data.triage.puntuacionRiesgo) || 3,
          emocionDetectada: data.triage.emocionDetectada || 'Calma',
          resumenClinico: data.triage.resumenClinico || 'Reporte de interacción clínica.',
          senalesDetectadas: Array.isArray(data.triage.senalesDetectadas) ? data.triage.senalesDetectadas : ['Conversación en chat'],
          recomendacion: data.triage.recomendacion || 'Monitoreo en consulta regular.',
          fragmentoMensaje: textToSend
        });
        saveDB(db);
        onUpdateDB();
        setLatestReportAlert(newReport);

        // Si la IA clasifica como Gravedad Alta (puntuación >= 4), emitir notificación y broadcast
        if (newReport.nivelGravedad === 'Alta' || newReport.puntuacionRiesgo >= 4) {
          broadcastCriticalAlert(newReport);
        }
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `f-${Date.now()}`,
          sender: 'felto',
          text: reply,
          timestamp: Date.now()
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `f-${Date.now()}`,
          sender: 'felto',
          text: 'Te escucho con cariño 🐾. A veces las palabras cuestan trabajo, pero lo importante es que te des este espacio para ti. ¿Quieres que hagamos una respiración juntos?',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLinkPsychologist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCodeInput.trim()) return;

    const psi = db.users.find(u => u.codigo?.toUpperCase() === linkCodeInput.trim().toUpperCase());
    if (psi) {
      user.psic = psi.id;
      const targetInDB = db.users.find(u => u.id === user.id);
      if (targetInDB) targetInDB.psic = psi.id;
      saveDB(db);
      onUpdateDB();
      setLinkStatusMsg({ ok: true, text: `¡Vinculado exitosamente con ${psi.nombre} ${psi.apellidos}!` });
      setLinkCodeInput('');
    } else {
      setLinkStatusMsg({ ok: false, text: 'Código no encontrado. Consulta con tu psicólogo.' });
    }
  };

  const handleDeleteHistory = () => {
    eliminarHistorial(db, user.id);
    saveDB(db);
    onUpdateDB();
    setShowDeleteConfirm(false);
    setFeedbackMsg(null);
  };

  const handleExportData = () => {
    const exportPayload = {
      usuario: {
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        genero: user.genero
      },
      psicologoVinculado: linkedPsi ? `${linkedPsi.nombre} ${linkedPsi.apellidos} (${linkedPsi.codigo})` : null,
      historialEmocional: history,
      fechaExportacion: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `felto_historial_${user.nombre.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = historyFilter === 'all'
    ? history
    : history.filter(h => h.e === historyFilter);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Welcome Banner with Puppy Mascot */}
      <div className="mb-8 p-6 sm:p-7 rounded-3xl bg-white border border-[#EFEAE1] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-[#EADDFE] shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <img
              src={LOGO_URL}
              alt="Felt.O Cachorro"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D2938]">
                ¡Hola, {user.nombre}!
              </h1>
              <span className="text-xs bg-[#F3EFFF] text-[#7C5FD1] px-2.5 py-0.5 rounded-full font-semibold border border-[#E7DCFE]">
                Felt.O te acompaña 🐾
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#746E80] mt-1 leading-relaxed">
              Cada emoción es una pequeña visita que trae un mensaje. Tómate este ratito para ti con calma y ternura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs text-[#7E7788] flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-full border border-[#EFEAE1]">
            <Calendar className="w-3.5 h-3.5 text-[#8C71D6]" aria-hidden="true" />
            <span>
              {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onTabChange('respirar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC] hover:bg-[#E2F7E8] transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4E9B66]" aria-hidden="true" />
            <span>Respiración 4-4-6</span>
          </button>
        </div>
      </div>

      {/* Gentle Inactivity Reminder */}
      {showReminder && (
        <section
          aria-label="Recordatorio de autocuidado"
          className="mb-8 p-4 rounded-2xl border border-[#FDEEBA] bg-[#FFFBEB] flex items-start gap-3 shadow-xs"
        >
          <Info className="w-5 h-5 text-[#B88B22] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <h2 className="font-bold text-[#8C6910]">
              Pausa de cariño para ti 🐾
            </h2>
            <p className="text-[#8C6910]/90 mt-0.5 text-xs sm:text-sm">
              Llevas más de 24 horas sin registrar cómo te sientes. Tómate un minutito para respirar y anotar tu estado.
            </p>
          </div>
        </section>
      )}

      {/* Tab: Respiración Guiada 4-4-6 */}
      {activeTab === 'respirar' && (
        <div className="my-8">
          <BreathingExercise onClose={() => onTabChange('inicio')} />
        </div>
      )}

      {/* Tab: Multi-turn Chat with Felt.O puppy companion */}
      {activeTab === 'chat' && (
        <section aria-labelledby="chat-heading" className="max-w-2xl mx-auto my-6">
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col h-[600px]">
            
            {/* Chat header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#EADDFE] shadow-xs p-0.5 overflow-hidden">
                  <img
                    src={LOGO_URL}
                    alt="Felt.O Cachorro"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 id="chat-heading" className="text-base font-bold text-[#2D2938]">
                    Chat con Felt.O
                  </h2>
                  <span className="text-[11px] text-[#7C5FD1] flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#78CE93]"></span>
                    Compañero empático listo para escucharte 🐾
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChatMessages([
                    {
                      id: `init-${Date.now()}`,
                      sender: 'felto',
                      text: `¡Hola de nuevo, ${user.nombre}! 🐾 Empecemos de cero. ¿Qué pensamiento o sensación tienes en mente hoy?`,
                      timestamp: Date.now()
                    }
                  ]);
                }}
                className="text-xs text-[#8A8394] hover:text-[#8C71D6] hover:underline"
              >
                Limpiar chat
              </button>
            </div>

            {/* AI Triage Real-time Clinical Alert Notification */}
            {latestReportAlert && (
              <div
                role="status"
                className={`p-4 rounded-2xl border text-xs mb-3 flex items-start justify-between gap-3 animate-in fade-in ${
                  latestReportAlert.nivelGravedad === 'Alta'
                    ? 'bg-[#FFF0F3] border-[#FFD7DF] text-[#B8445E]'
                    : latestReportAlert.nivelGravedad === 'Media'
                    ? 'bg-[#FFF4EB] border-[#FFE3CC] text-[#B8642A]'
                    : 'bg-[#EDF9F0] border-[#D4F2DC] text-[#327347]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">
                    {latestReportAlert.nivelGravedad === 'Alta' ? '🚨' : latestReportAlert.nivelGravedad === 'Media' ? '📋' : '🌿'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap font-bold">
                      <span>Reporte Clínico de Gravedad {latestReportAlert.nivelGravedad.toUpperCase()} generado</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/90 border font-mono">
                        Riesgo {latestReportAlert.puntuacionRiesgo}/5
                      </span>
                    </div>
                    <p className="mt-1 leading-relaxed opacity-95">
                      {latestReportAlert.nivelGravedad === 'Alta'
                        ? `He notificado prioritariamente al consultorio de tu psicólogo (${linkedPsi ? linkedPsi.nombre : 'pendiente de vincular'}). Recuerda que tu bienestar es lo más importante: si sientes riesgo inminente, llama al 911 o acude al centro de salud más cercano.`
                        : latestReportAlert.nivelGravedad === 'Media'
                        ? `He enviado una síntesis clínica a tu psicólogo para que puedan profundizar en esta inquietud en tu próxima sesión.`
                        : `He registrado un reporte de estabilidad favorable en tu expediente clínico.`}
                    </p>
                    <p className="text-[11px] mt-1.5 italic opacity-85">
                      Diagnóstico preliminar: "{latestReportAlert.resumenClinico}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLatestReportAlert(null)}
                  className="p-1 hover:opacity-75 shrink-0 text-sm font-bold"
                  aria-label="Cerrar notificación"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Scrollable chat thread */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 custom-scrollbar"
            >
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'felto' && (
                    <div className="w-8 h-8 rounded-full bg-white border border-[#EADDFE] p-0.5 shrink-0 overflow-hidden shadow-xs mt-0.5">
                      <img src={LOGO_URL} alt="Felt.O" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#8C71D6] text-white rounded-tr-xs font-medium'
                        : 'bg-[#FAF7F2] text-[#2D2938] rounded-tl-xs border border-[#EFE8DE]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#EADDFE] p-0.5 shrink-0 overflow-hidden shadow-xs">
                    <img src={LOGO_URL} alt="Felt.O" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#EFE8DE] px-4 py-2 rounded-2xl text-xs text-[#7A7485] flex items-center gap-1.5">
                    <span>Felt.O está pensando con cariño</span>
                    <span className="animate-pulse">🐾...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested quick reflection prompts */}
            <div className="pt-2 pb-2 flex items-center gap-1.5 overflow-x-auto text-[11px] border-t border-[#F5EFE6]">
              <span className="text-[#8E8799] shrink-0 font-medium">Sugerencias:</span>
              <button
                type="button"
                onClick={() => handleSendChatMessage('Hoy me siento un poco abrumado/a con mis pendientes.')}
                className="px-2.5 py-1 rounded-full bg-[#FFF4EB] text-[#B8642A] border border-[#FFE3CC] whitespace-nowrap hover:bg-[#FFEADA]"
              >
                Abrumado/a con pendientes
              </button>
              <button
                type="button"
                onClick={() => handleSendChatMessage('Tengo un nudo de tristeza y no sé por qué.')}
                className="px-2.5 py-1 rounded-full bg-[#F0F5FD] text-[#3E6A9E] border border-[#DBE6F8] whitespace-nowrap hover:bg-[#E4EEFB]"
              >
                Tristeza sin motivo
              </button>
              <button
                type="button"
                onClick={() => handleSendChatMessage('Tuve un logro bonito y quiero celebrarlo contigo.')}
                className="px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#9A7314] border border-[#FDEEBA] whitespace-nowrap hover:bg-[#FEF8DD]"
              >
                Celebrar un logro ☀️
              </button>
            </div>

            {/* Chat input box */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="pt-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputChatText}
                onChange={e => setInputChatText(e.target.value)}
                placeholder="Escribe lo que sientes o lo que quieras contarle a Felt.O..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
              />
              <button
                type="submit"
                disabled={!inputChatText.trim() || isChatLoading}
                aria-label="Enviar mensaje"
                className="px-4 py-2.5 rounded-2xl bg-[#8C71D6] hover:bg-[#7D61CC] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Tab: Mi Perfil & Privacidad */}
      {activeTab === 'perf' && (
        <section aria-labelledby="profile-heading" className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* User Details */}
            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
              <h2 id="profile-heading" className="text-base font-bold text-[#2D2938] mb-4">
                Información de tu Cuenta
              </h2>
              <dl className="space-y-3 text-xs sm:text-sm">
                <div>
                  <dt className="text-[#868091] text-xs">Nombre Completo</dt>
                  <dd className="font-semibold text-[#2D2938] mt-0.5">
                    {user.nombre} {user.apellidos}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#868091] text-xs">Correo Electrónico</dt>
                  <dd className="font-semibold text-[#2D2938] mt-0.5">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-[#868091] text-xs">Psicólogo Vinculado</dt>
                  <dd className="font-semibold mt-0.5">
                    {linkedPsi ? (
                      <div className="space-y-1">
                        <span className="text-[#327347] bg-[#EDF9F0] px-2.5 py-1 rounded-full border border-[#D4F2DC] inline-block font-semibold">
                          {linkedPsi.nombre} {linkedPsi.apellidos} ({linkedPsi.codigo})
                        </span>
                        {linkedPsi.verificado && (
                          <span className="block text-[11px] text-[#3D8556] font-medium">
                            ✓ Psicólogo Titulado y Verificado · Cédula #{linkedPsi.cedula || '12345678'} (DGP)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#8E8799]">Aún sin vincular</span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Linking form */}
              <form onSubmit={handleLinkPsychologist} className="mt-6 pt-5 border-t border-[#F5EFE6]">
                <label htmlFor="input-link-psi" className="block text-xs font-semibold text-[#575162] mb-1">
                  Vincular o cambiar psicólogo
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-link-psi"
                    type="text"
                    value={linkCodeInput}
                    onChange={e => setLinkCodeInput(e.target.value)}
                    placeholder="Código (Ej. PSIC-5678)"
                    className="flex-1 px-3.5 py-2 text-xs uppercase font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-xl transition-colors shadow-xs"
                  >
                    Vincular
                  </button>
                </div>
                {linkStatusMsg && (
                  <p className={`mt-2 text-xs font-semibold ${linkStatusMsg.ok ? 'text-[#327347]' : 'text-[#B8445E]'}`}>
                    {linkStatusMsg.text}
                  </p>
                )}
              </form>
            </div>

            {/* Privacy & ARCO Rights */}
            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-[#8C71D6]" aria-hidden="true" />
                  <h2 className="text-base font-bold text-[#2D2938]">
                    Tus Derechos y Privacidad
                  </h2>
                </div>
                <p className="text-xs text-[#6B6576] leading-relaxed mb-4">
                  En Felt.O cuidamos tus datos sensibles con la máxima confidencialidad. Puedes descargar tu historial
                  o ejercer tu derecho al olvido eliminándolo permanentemente cuando gustes.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#EFEAE1] bg-[#FAF8F5] text-xs font-semibold text-[#4D4857] hover:bg-[#F3EFE9] transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#8C71D6]" aria-hidden="true" />
                    <span>Descargar mi historial (.JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#FFD7DF] bg-[#FFF0F3] text-xs font-semibold text-[#B8445E] hover:bg-[#FFE4EA] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Eliminar mi historial (Derechos ARCO)</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F5EFE6] text-[11px] text-[#8E8799]">
                Registros totales acumulados: <span className="font-bold text-[#2D2938] tabular-nums">{history.length}</span>
              </div>
            </div>

          </div>

          {/* Clinical Reports History from Chat AI Triage */}
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div>
                <h3 className="text-base font-bold text-[#2D2938]">
                  Reportes Clínicos Enviados a tu Terapeuta 🐾
                </h3>
                <p className="text-xs text-[#7A7485]">
                  Evaluaciones automáticas de gravedad generadas durante tus conversaciones con Felt.O
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F3EFFF] text-[#7252C4] border border-[#E7DCFE]">
                {patientReports.length} {patientReports.length === 1 ? 'reporte' : 'reportes'}
              </span>
            </div>

            {patientReports.length > 0 ? (
              <div className="divide-y divide-[#F5EFE6] mt-3">
                {patientReports.map(rep => (
                  <div key={rep.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">
                        {rep.nivelGravedad === 'Alta' ? '🚨' : rep.nivelGravedad === 'Media' ? '📋' : '🌿'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              rep.nivelGravedad === 'Alta'
                                ? 'bg-[#FFF0F3] text-[#B8445E] border-[#FFD7DF]'
                                : rep.nivelGravedad === 'Media'
                                ? 'bg-[#FFF4EB] text-[#B8642A] border-[#FFE3CC]'
                                : 'bg-[#EDF9F0] text-[#327347] border-[#D4F2DC]'
                            }`}
                          >
                            Gravedad {rep.nivelGravedad} (Riesgo {rep.puntuacionRiesgo}/5)
                          </span>
                          <span className="text-xs font-semibold text-[#4D4857]">
                            {rep.emocionDetectada}
                          </span>
                          {rep.atendido ? (
                            <span className="text-[10px] text-[#327347] bg-[#E8F8EC] px-2 py-0.5 rounded-full">
                              ✓ Revisado por terapeuta
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#B8642A] bg-[#FFF4EB] px-2 py-0.5 rounded-full">
                              Pendiente de revisión
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A5464] mt-1 leading-relaxed">
                          {rep.resumenClinico}
                        </p>
                        <p className="text-[11px] text-[#8A8394] mt-0.5 italic">
                          "Mensaje evaluado: {rep.fragmentoMensaje}"
                        </p>
                      </div>
                    </div>

                    <time className="text-[11px] font-mono text-[#8E8799] shrink-0 sm:text-right">
                      {new Date(rep.fecha).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8E8799] italic py-6 text-center">
                Aún no se han generado reportes clínicos desde el chat.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Tab: Inicio / Diario Emocional (Default View) */}
      {activeTab === 'inicio' && (
        <div className="space-y-8">
          
          {/* Quick Check-in Card in Light Pastel */}
          <section aria-labelledby="checkin-heading" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl">
              <h2 id="checkin-heading" className="text-lg font-bold text-[#2D2938]">
                ¿Cómo late tu corazón hoy?
              </h2>
              <p className="text-xs sm:text-sm text-[#746E80] mt-1">
                Selecciona la emoción que más resuene contigo en este instante:
              </p>
            </div>

            {/* 6 Core Emotion buttons with sweet pastel cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
              {(Object.keys(EMO_DATA) as EmotionType[]).map(emotion => {
                const meta = EMO_DATA[emotion];
                const isSelected = selectedEmotion === emotion;

                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? `${meta.bgPastel} ${meta.borderPastel} shadow-xs ring-2 ring-[#8C71D6] scale-102`
                        : `${meta.bgPastel} border-transparent hover:${meta.borderPastel} hover:shadow-xs`
                    }`}
                  >
                    <span className="text-2xl mb-1.5" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <span className={`text-xs font-bold ${meta.textPastel}`}>
                      {emotion}
                    </span>
                    <span className="text-[10px] text-[#8E8799] truncate max-w-full mt-0.5">
                      {meta.label.split('&')[1]?.trim() || ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detailed configuration when emotion is selected */}
            {selectedEmotion && (
              <div className="pt-4 border-t border-[#F5EFE6] max-w-2xl space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Intensity slider */}
                  <div>
                    <label htmlFor="intensity-slider" className="block text-xs font-semibold text-[#575162] mb-1">
                      Intensidad percibida: <span className="tabular-nums font-bold text-[#8C71D6]">{intensity}/5</span>
                    </label>
                    <input
                      id="intensity-slider"
                      type="range"
                      min="1"
                      max="5"
                      value={intensity}
                      onChange={e => setIntensity(Number(e.target.value))}
                      className="w-full accent-[#8C71D6] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8E8799] mt-1">
                      <span>1 (Suave)</span>
                      <span>3 (Moderada)</span>
                      <span>5 (Intensa)</span>
                    </div>
                  </div>

                  {/* Context / Trigger */}
                  <div>
                    <label htmlFor="trigger-select" className="block text-xs font-semibold text-[#575162] mb-1">
                      Contexto o detonante principal
                    </label>
                    <select
                      id="trigger-select"
                      value={trigger}
                      onChange={e => setTrigger(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                    >
                      <option value="Trabajo / Estudio">Trabajo / Estudio</option>
                      <option value="Familia">Familia</option>
                      <option value="Pareja">Pareja</option>
                      <option value="Amigos / Social">Amigos / Social</option>
                      <option value="Salud / Cuerpo">Salud / Cuerpo</option>
                      <option value="Rutina diaria">Rutina diaria</option>
                      <option value="Sin motivo particular">Sin motivo particular</option>
                    </select>
                  </div>
                </div>

                {/* Personal Note */}
                <div>
                  <label htmlFor="emotion-note" className="block text-xs font-semibold text-[#575162] mb-1">
                    Nota o pensamiento reflexivo <span className="font-normal text-[#8A8394]">(opcional)</span>
                  </label>
                  <input
                    id="emotion-note"
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="¿Qué pensamiento o situación acompañó esta emoción?"
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C71D6]"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickRegister(selectedEmotion)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-xl transition-all shadow-xs"
                  >
                    Guardar en mi Diario
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEmotion(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#8A8394] hover:text-[#2D2938]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Instant Coping Advice Card in Pastel */}
            {feedbackMsg && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 p-4 rounded-2xl border border-[#D4F2DC] bg-[#EDF9F0] text-xs sm:text-sm animate-in fade-in"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#327347] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#29633B]">
                      Emoción registrada: {feedbackMsg.emotion} ✨
                    </p>
                    <p className="text-[#327347] leading-relaxed">
                      {feedbackMsg.msg}
                    </p>
                    <p className="text-[#2C693E] text-xs italic pt-1">
                      💡 {feedbackMsg.exercise}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2-Column Grid: Emotional Balance & Timeline Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Emotion Balance Metrics (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <section aria-labelledby="metrics-heading" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
                <h2 id="metrics-heading" className="text-base font-bold text-[#2D2938] mb-1">
                  Tu Balance Emocional
                </h2>
                <p className="text-xs text-[#7A7485] mb-6">
                  Distribución acumulada ({history.length} registros)
                </p>

                {history.length > 0 ? (
                  <div className="space-y-3.5">
                    {(Object.keys(EMO_DATA) as EmotionType[]).map(e => {
                      const count = emotionCounts[e] || 0;
                      const percent = history.length ? Math.round((count * 100) / history.length) : 0;
                      const meta = EMO_DATA[e];

                      return (
                        <div key={e} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-semibold text-[#4D4857]">
                              <span>{meta.icon}</span>
                              <span>{e}</span>
                            </span>
                            <span className="font-mono text-[#7A7485] tabular-nums font-medium">
                              {percent}% <span className="text-[10px] text-[#A39CAE]">({count})</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#FAF7F2] overflow-hidden border border-[#EFEAE1]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%`, backgroundColor: meta.barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8799] italic py-4 text-center">
                    Aún no cuentas con registros para calcular tu balance.
                  </p>
                )}
              </section>

              {/* Chat with Puppy Companion Quick Teaser */}
              <div className="bg-[#FFFDF9] border border-[#EFEAE1] rounded-3xl p-6 text-xs sm:text-sm shadow-xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-white border border-[#EADDFE] shadow-xs p-0.5 shrink-0 overflow-hidden">
                  <img src={LOGO_URL} alt="Felt.O" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2D2938]">
                    ¿Quieres platicar conmigo?
                  </h3>
                  <p className="text-[#746E80] text-xs mt-0.5 mb-2">
                    Felt.O está listo para escucharte con cariño.
                  </p>
                  <button
                    type="button"
                    onClick={() => onTabChange('chat')}
                    className="inline-flex items-center gap-1 font-bold text-[#8C71D6] hover:underline text-xs"
                  >
                    <span>Abrir Chat con Felt.O 🐾</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: History Chronology (8 cols) */}
            <div className="lg:col-span-8">
              <section aria-labelledby="history-heading" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F5EFE6]">
                  <div>
                    <h2 id="history-heading" className="text-base font-bold text-[#2D2938]">
                      Historial en tu Diario
                    </h2>
                    <p className="text-xs text-[#7A7485]">
                      Tus reflexiones guardadas con amor
                    </p>
                  </div>

                  {/* Filter selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[#868091]">Filtrar:</span>
                    <select
                      value={historyFilter}
                      onChange={e => setHistoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938]"
                    >
                      <option value="all">Todas ({history.length})</option>
                      {(Object.keys(EMO_DATA) as EmotionType[]).map(e => (
                        <option key={e} value={e}>
                          {e} ({emotionCounts[e] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredHistory.length > 0 ? (
                  <div className="divide-y divide-[#F5EFE6] mt-2">
                    {filteredHistory.map((item, idx) => {
                      const meta = EMO_DATA[item.e];
                      const dateStr = new Date(item.t).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <article key={idx} className="py-3.5 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
                              {meta.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badgePastel}`}>
                                  {item.e}
                                </span>
                                <span className="text-[11px] text-[#A39CAE]">·</span>
                                <span className="text-[11px] text-[#6E6779] tabular-nums font-medium">
                                  Intensidad {item.n}/5
                                </span>
                                {item.detonante && (
                                  <>
                                    <span className="text-[11px] text-[#A39CAE]">·</span>
                                    <span className="text-[11px] text-[#6E6779]">
                                      {item.detonante}
                                    </span>
                                  </>
                                )}
                              </div>
                              {item.nota && (
                                <p className="text-xs text-[#4D4857] mt-1 italic">
                                  "{item.nota}"
                                </p>
                              )}
                            </div>
                          </div>

                          <time className="text-[11px] text-[#9A94A4] font-mono shrink-0 whitespace-nowrap">
                            {dateStr}
                          </time>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#8E8799]">
                    No hay registros con el filtro seleccionado.
                  </div>
                )}
              </section>
            </div>

          </div>

        </div>
      )}

      {/* ARCO Rights Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A4553]/40 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 text-[#B8445E] mb-3">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              <h3 id="confirm-delete-title" className="text-base font-bold text-[#2D2938]">
                Confirmar eliminación de historial
              </h3>
            </div>
            <p className="text-xs text-[#6B6576] leading-relaxed mb-6">
              Esta acción borrará definitivamente tus registros de emociones y sesiones de chat en ejercicio de tus
              derechos ARCO. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6E6779] hover:bg-[#FAF8F5]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteHistory}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#D45D79] text-white hover:bg-[#C24E69] shadow-xs"
              >
                Sí, eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
