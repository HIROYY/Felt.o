/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, EmotionType, User, ClinicalReport, SeverityLevel, SubscriptionPlan, BillingInvoice } from '../types';
import {
  EMO_DATA,
  POSITIVE_EMOTIONS,
  historial,
  reporte,
  LOGO_URL,
  obtenerReportesPsicologo,
  marcarReporteAtendido,
  saveDB,
  PLANES_PRECIOS,
  procesarPagoSuscripcion,
  cancelarAutoRenovacion
} from '../lib/db';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNativeCriticalNotification,
  playAlertChime,
  subscribeToCriticalAlerts
} from '../lib/notifications';
import {
  AlertCircle,
  Copy,
  Check,
  Stethoscope,
  Printer,
  ChevronRight,
  ShieldAlert,
  Clock,
  Filter,
  CheckCircle2,
  X,
  Mail,
  ExternalLink,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Download,
  Lock,
  Zap,
  Award
} from 'lucide-react';

interface PsychologistViewProps {
  user: User;
  db: Database;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdateDB: () => void;
}

export const PsychologistView: React.FC<PsychologistViewProps> = ({
  user,
  db,
  activeTab,
  onTabChange,
  onUpdateDB
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // AI Triage Reports state
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'attended'>('all');
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);

  // Native Browser Notification state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );
  const [testNotifFeedback, setTestNotifFeedback] = useState<string | null>(null);

  // Subscription, Billing & Checkout state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<'ConsultorioPro' | 'ClinicaEquipo'>(
    user.plan === 'ClinicaEquipo' ? 'ClinicaEquipo' : 'ConsultorioPro'
  );
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('789');
  const [cardHolder, setCardHolder] = useState<string>(`${user.nombre} ${user.apellidos}`.trim());
  const [couponCode, setCouponCode] = useState<string>('FELTO20');
  const [billingFeedbackMsg, setBillingFeedbackMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Profitability (ROI) Interactive Calculator state
  const [roiSessionFee, setRoiSessionFee] = useState<number>(650); // $650 MXN per session
  const [roiPatientCount, setRoiPatientCount] = useState<number>(18); // 18 active patients
  const [roiSessionsPerMonth, setRoiSessionsPerMonth] = useState<number>(2); // 2 sessions per patient/month

  // Subscribe to real-time high gravity clinical alerts (cross-tab & in-app)
  useEffect(() => {
    const unsubscribe = subscribeToCriticalAlerts((critReport) => {
      // Trigger native desktop notification with audio chime
      sendNativeCriticalNotification(critReport, () => {
        onTabChange('alertas');
        setSelectedReport(critReport);
      });
      // Refresh DB so new report is visible in clinician's list
      onUpdateDB();
    });

    return () => {
      unsubscribe();
    };
  }, [onTabChange, onUpdateDB]);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      playAlertChime(false);
      setTestNotifFeedback('¡Notificaciones nativas activadas con éxito! Recibirás alertas inmediatas.');
      setTimeout(() => setTestNotifFeedback(null), 4000);
    } else if (result === 'denied') {
      setTestNotifFeedback('Las notificaciones fueron denegadas en el navegador. Por favor habilítalas en la configuración de permisos del sitio.');
      setTimeout(() => setTestNotifFeedback(null), 5000);
    }
  };

  const handleTestNotification = () => {
    playAlertChime(true);
    const mockReport: ClinicalReport = {
      id: `test-alerta-${Date.now()}`,
      pacienteId: 2,
      pacienteNombre: 'Paciente Demo (Prueba)',
      psicologoId: user.id,
      nivelGravedad: 'Alta',
      puntuacionRiesgo: 5,
      emocionDetectada: 'Ansiedad',
      resumenClinico: 'Prueba de alerta nativa del navegador: Notificación inmediata de gravedad alta recibida.',
      senalesDetectadas: ['Prueba del sistema de alertas para psicólogos'],
      recomendacion: 'Verificación del canal de notificación sonora y de escritorio.',
      fecha: Date.now(),
      atendido: false,
      fragmentoMensaje: 'Prueba de alerta inmediata de gravedad alta.'
    };

    const sent = sendNativeCriticalNotification(mockReport, () => {
      onTabChange('alertas');
    });

    if (sent) {
      setTestNotifFeedback('¡Alerta de escritorio enviada y sonido emitido! 🔔');
    } else {
      setTestNotifFeedback('Chime de alerta sonora emitido 🔊 (Permiso de notificación no activado aún)');
    }
    setTimeout(() => setTestNotifFeedback(null), 4000);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setBillingFeedbackMsg(null);

    setTimeout(() => {
      const res = procesarPagoSuscripcion(db, user.id, selectedPlanToBuy, {
        numeroTarjeta: cardNumber,
        expiracion: cardExp,
        cvv: cardCvv,
        titular: cardHolder,
        cupon: couponCode
      });

      setIsProcessingPayment(false);
      if (res.ok) {
        setBillingFeedbackMsg({ ok: true, text: res.msg || 'Suscripción activada exitosamente' });
        saveDB(db);
        onUpdateDB();
        setTimeout(() => {
          setIsCheckoutModalOpen(false);
          setBillingFeedbackMsg(null);
        }, 2200);
      } else {
        setBillingFeedbackMsg({ ok: false, text: res.msg || 'Error al procesar pago' });
      }
    }, 500);
  };

  const handleToggleAutoRenew = () => {
    if (user.autoRenovar) {
      const res = cancelarAutoRenovacion(db, user.id);
      saveDB(db);
      onUpdateDB();
      setBillingFeedbackMsg({ ok: true, text: res.msg });
      setTimeout(() => setBillingFeedbackMsg(null), 3500);
    } else {
      user.autoRenovar = true;
      saveDB(db);
      onUpdateDB();
      setBillingFeedbackMsg({ ok: true, text: 'Auto-renovación mensual reactivada.' });
      setTimeout(() => setBillingFeedbackMsg(null), 3500);
    }
  };

  const patients = db.users.filter(u => u.psic === user.id);
  const allPatientRecords = db.emo.filter(e => patients.some(p => p.id === e.u));
  const reports = obtenerReportesPsicologo(db, user.id);

  const lastPatientRecord = (patientId: number) => historial(db, patientId)[0];
  
  const isCriticalPatient = (patientId: number) => {
    const last = lastPatientRecord(patientId);
    return Boolean(last && ['Triste', 'Miedo', 'Ansiedad', 'Enojo'].includes(last.e) && last.n >= 4);
  };

  const criticalCount = patients.filter(p => isCriticalPatient(p.id)).length;
  const unattendedReports = reports.filter(r => !r.atendido);
  const unattendedHighCount = reports.filter(r => !r.atendido && r.nivelGravedad === 'Alta').length;

  const positiveCount = allPatientRecords.filter(r => POSITIVE_EMOTIONS.includes(r.e)).length;
  const positivePercentage = allPatientRecords.length
    ? Math.round((positiveCount * 100) / allPatientRecords.length)
    : 0;

  const totalEmotionCounts = allPatientRecords.reduce((acc, r) => {
    acc[r.e] = (acc[r.e] || 0) + 1;
    return acc;
  }, {} as Record<EmotionType, number>);

  const handleCopyCode = () => {
    if (user.codigo) {
      navigator.clipboard.writeText(user.codigo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleMarkAttended = (reportId: string) => {
    marcarReporteAtendido(db, reportId);
    saveDB(db);
    onUpdateDB();
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, atendido: true, fechaAtencion: Date.now() });
    }
  };

  const activePatientForReport = selectedPatientId
    ? patients.find(p => p.id === selectedPatientId)
    : patients[0];

  const currentReport = activePatientForReport
    ? reporte(db, user.id, activePatientForReport.id, selectedMonth)
    : null;

  const handlePrintReport = () => {
    window.print();
  };

  const timeAgoStr = (timestamp: number) => {
    const diffHours = Math.round((Date.now() - timestamp) / 3600000);
    if (diffHours < 1) return 'Hace instantes';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const days = Math.floor(diffHours / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  };

  // Filtered reports list
  const filteredReports = reports.filter(r => {
    if (severityFilter !== 'all' && r.nivelGravedad !== severityFilter) return false;
    if (statusFilter === 'pending' && r.atendido) return false;
    if (statusFilter === 'attended' && !r.atendido) return false;
    return true;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Clinician Welcome Banner with Puppy Logo */}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D2938]">
                {user.nombre} {user.apellidos}
              </h1>
              {user.verificado ? (
                <span className="text-xs bg-[#EDF9F0] text-[#2C693E] px-2.5 py-0.5 rounded-full font-semibold border border-[#D4F2DC] flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3D8556]" />
                  <span>Psicólogo Clínico Verificado · DGP</span>
                </span>
              ) : (
                <span className="text-xs bg-[#FFFBEB] text-[#8C6910] px-2.5 py-0.5 rounded-full font-semibold border border-[#FDEEBA]">
                  Verificación en trámite
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#746E80] mt-1">
              {user.esp || 'Psicología Clínica'} · Cédula: <span className="font-mono font-semibold text-[#2D2938]">{user.cedula || '12345678'}</span>
              {user.universidad && (
                <span className="hidden sm:inline text-[#8E8799]"> · {user.universidad}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Subscription quick badge button */}
          <button
            type="button"
            onClick={() => onTabChange('suscripcion')}
            className="p-2 px-3 bg-[#FAF7F2] hover:bg-[#F3EFE9] rounded-2xl flex items-center gap-2 border border-[#EFEAE1] transition-colors shadow-2xs text-left"
            title="Ver detalles de suscripción y facturación mensual"
          >
            <CreditCard className="w-4 h-4 text-[#8C71D6] shrink-0" />
            <div>
              <span className="text-[10px] text-[#7A7485] block leading-none">Suscripción Mensual</span>
              <span className="text-xs font-bold text-[#2D2938]">
                {user.plan === 'ClinicaEquipo' ? 'Clínica & Equipo' : 'Consultorio Pro'}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              user.estadoSuscripcion === 'Activa'
                ? 'bg-[#EDF9F0] text-[#2C693E] border-[#D4F2DC]'
                : 'bg-[#FFFBEB] text-[#8C6910] border-[#FDEEBA]'
            }`}>
              {user.estadoSuscripcion || 'Activa'}
            </span>
          </button>

          <div className="p-2.5 px-3.5 bg-[#FAF7F2] rounded-2xl flex items-center gap-2 border border-[#EFEAE1]">
            <span className="text-xs text-[#7A7485]">Tu Código:</span>
            <span className="text-sm font-bold font-mono text-[#8C71D6]">
              {user.codigo}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copiar código de vinculación"
              className="p-1 hover:bg-[#EFE9DF] rounded-lg transition-colors text-[#6E6779]"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#3D8556]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Native Browser Notification Control Bar */}
      <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-white border border-[#EFEAE1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
            notifPermission === 'granted'
              ? 'bg-[#EDF9F0] border-[#D4F2DC] text-[#2C693E]'
              : notifPermission === 'denied'
              ? 'bg-[#FFF0F3] border-[#FFD7DF] text-[#B8445E]'
              : 'bg-[#FFFBEB] border-[#FDEEBA] text-[#8C6910]'
          }`}>
            {notifPermission === 'granted' ? (
              <BellRing className="w-5 h-5 text-[#3D8556]" />
            ) : notifPermission === 'denied' ? (
              <BellOff className="w-5 h-5 text-[#B8445E]" />
            ) : (
              <Bell className="w-5 h-5 text-[#8C6910]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#2D2938]">
                Sistema de Notificaciones Nativas del Navegador
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                notifPermission === 'granted'
                  ? 'bg-[#EDF9F0] text-[#2C693E] border-[#D4F2DC]'
                  : notifPermission === 'denied'
                  ? 'bg-[#FFF0F3] text-[#B8445E] border-[#FFD7DF]'
                  : 'bg-[#FFFBEB] text-[#8C6910] border-[#FDEEBA]'
              }`}>
                {notifPermission === 'granted'
                  ? '✓ Activas y Autorizadas'
                  : notifPermission === 'denied'
                  ? '✕ Bloqueadas por el navegador'
                  : 'Pendiente de activación'}
              </span>
            </div>
            <p className="text-xs text-[#746E80] mt-0.5 leading-relaxed">
              {notifPermission === 'granted'
                ? 'Recibirás avisos emergentes en tu pantalla y sonido de alerta cuando un paciente reporte Gravedad Alta en el chat.'
                : notifPermission === 'denied'
                ? 'Las notificaciones están bloqueadas en tu navegador. Por favor habilítalas desde el ícono de candado en la barra de direcciones.'
                : 'Activa las notificaciones del navegador para recibir alertas inmediatas de riesgo alto en tu pantalla.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Activar Notificaciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTestNotification}
            className="px-3 py-2 text-xs font-semibold text-[#575162] hover:text-[#2D2938] bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#E8E2D8] rounded-xl transition-colors flex items-center gap-1.5"
            title="Reproduce el sonido y envía una notificación de prueba"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#8C71D6]" />
            <span>Probar Alerta</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast for Test Notification */}
      {testNotifFeedback && (
        <div
          role="status"
          className="mb-6 p-3.5 rounded-2xl bg-[#F3EFFF] border border-[#EADDFE] text-[#583E9E] text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#8C71D6]" />
            <span>{testNotifFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setTestNotifFeedback(null)}
            className="text-xs text-[#8C71D6] hover:text-[#583E9E] font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unattended Critical Alert Banner if any */}
      {unattendedHighCount > 0 && activeTab !== 'alertas' && (
        <div
          role="alert"
          onClick={() => onTabChange('alertas')}
          className="mb-8 p-4.5 rounded-3xl bg-[#FFF0F3] border border-[#FFD7DF] text-[#B8445E] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FFE6EC] transition-colors shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white border border-[#FFD7DF] flex items-center justify-center text-[#B8445E] shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold">
                {unattendedHighCount} Alerta{unattendedHighCount > 1 ? 's' : ''} de Gravedad Alta generada{unattendedHighCount > 1 ? 's' : ''} por la IA
              </h2>
              <p className="text-xs text-[#B8445E]/90 mt-0.5">
                El chatbot Felt.O ha detectado sobrecarga emocional severa en tus pacientes. Pulsa para revisar el reporte.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#D45D79] text-white text-xs font-bold hover:bg-[#C24E69] transition-colors whitespace-nowrap shadow-xs"
          >
            Revisar Alertas 🚨
          </button>
        </div>
      )}

      {/* Tab: Alertas & Reportes de Gravedad IA (Nueva funcionalidad solicitada) */}
      {activeTab === 'alertas' && (
        <section aria-labelledby="alerts-title" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE1]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#B8445E]" aria-hidden="true" />
                <h2 id="alerts-title" className="text-lg font-bold text-[#2D2938]">
                  Alertas y Reportes Clínicos de la IA
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#7A7485] mt-0.5">
                Evaluaciones de riesgo enviadas automáticamente por Felt.O según la gravedad que manifiesta el paciente al hablar con el chatbot
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Severity filter */}
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-[#2D2938] text-xs font-medium"
              >
                <option value="all">Todas las gravedades ({reports.length})</option>
                <option value="Alta">🚨 Gravedad Alta ({reports.filter(r => r.nivelGravedad === 'Alta').length})</option>
                <option value="Media">📋 Gravedad Media ({reports.filter(r => r.nivelGravedad === 'Media').length})</option>
                <option value="Baja">🌿 Gravedad Baja ({reports.filter(r => r.nivelGravedad === 'Baja').length})</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-[#2D2938] text-xs font-medium"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Solo Pendientes ({unattendedReports.length})</option>
                <option value="attended">Solo Atendidos</option>
              </select>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Reports List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {filteredReports.length > 0 ? (
                filteredReports.map(rep => {
                  const isSelected = selectedReport?.id === rep.id;
                  const isHigh = rep.nivelGravedad === 'Alta';
                  const isMedium = rep.nivelGravedad === 'Media';

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-4.5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'border-[#8C71D6] ring-2 ring-[#EADDFE] bg-[#FFFEFC]'
                          : isHigh && !rep.atendido
                          ? 'border-[#FFD7DF] bg-[#FFF8F9] hover:bg-[#FFF2F5]'
                          : 'border-[#EFEAE1] bg-white hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              isHigh
                                ? 'bg-[#FFF0F3] text-[#B8445E] border-[#FFD7DF]'
                                : isMedium
                                ? 'bg-[#FFF4EB] text-[#B8642A] border-[#FFE3CC]'
                                : 'bg-[#EDF9F0] text-[#327347] border-[#D4F2DC]'
                            }`}
                          >
                            Gravedad {rep.nivelGravedad} · Riesgo {rep.puntuacionRiesgo}/5
                          </span>
                          <span className="text-xs font-bold text-[#2D2938]">
                            {rep.pacienteNombre}
                          </span>
                        </div>

                        {rep.atendido ? (
                          <span className="text-[10px] font-semibold text-[#327347] bg-[#E8F8EC] px-2 py-0.5 rounded-full">
                            ✓ Atendido
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#B8445E] bg-[#FFE2E8] px-2 py-0.5 rounded-full animate-pulse">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#5A5464] font-medium leading-relaxed mt-1">
                        {rep.resumenClinico}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-[#F5EFE6] flex items-center justify-between text-[11px] text-[#8E8799]">
                        <span className="flex items-center gap-1 font-semibold text-[#8C71D6]">
                          <span>{EMO_DATA[rep.emocionDetectada]?.icon}</span>
                          <span>{rep.emocionDetectada}</span>
                        </span>
                        <time className="font-mono">
                          {timeAgoStr(rep.fecha)}
                        </time>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-white border border-[#EFEAE1] rounded-3xl text-xs text-[#8E8799]">
                  No se encontraron reportes con los filtros seleccionados.
                </div>
              )}
            </div>

            {/* Selected Report Detail Card (5 cols) */}
            <div className="lg:col-span-5">
              {selectedReport ? (
                <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs sticky top-24 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]">
                    <div>
                      <span className="text-[10px] text-[#8E8799] uppercase font-bold tracking-wider">
                        Detalle del Reporte Clínico
                      </span>
                      <h3 className="text-base font-bold text-[#2D2938]">
                        {selectedReport.pacienteNombre}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(null)}
                      className="p-1 text-[#8E8799] hover:text-[#2D2938] rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Level & Risk */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE1]">
                    <div>
                      <span className="text-[11px] text-[#7E7788] block">Nivel de Gravedad</span>
                      <span
                        className={`text-sm font-bold ${
                          selectedReport.nivelGravedad === 'Alta'
                            ? 'text-[#B8445E]'
                            : selectedReport.nivelGravedad === 'Media'
                            ? 'text-[#B8642A]'
                            : 'text-[#327347]'
                        }`}
                      >
                        {selectedReport.nivelGravedad} (Puntuación {selectedReport.puntuacionRiesgo}/5)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#7E7788] block">Emoción</span>
                      <span className="text-sm font-bold text-[#2D2938] flex items-center gap-1 justify-end">
                        <span>{EMO_DATA[selectedReport.emocionDetectada]?.icon}</span>
                        <span>{selectedReport.emocionDetectada}</span>
                      </span>
                    </div>
                  </div>

                  {/* Message evaluated */}
                  <div>
                    <h4 className="text-xs font-bold text-[#6E6779] mb-1">
                      Mensaje del paciente en el chat:
                    </h4>
                    <p className="text-xs text-[#2D2938] p-3 rounded-2xl bg-[#FFFDF9] border border-[#EFEAE1] italic">
                      "{selectedReport.fragmentoMensaje}"
                    </p>
                  </div>

                  {/* Clinical Synthesis */}
                  <div>
                    <h4 className="text-xs font-bold text-[#6E6779] mb-1">
                      Evaluación clínica de la IA:
                    </h4>
                    <p className="text-xs text-[#5A5464] leading-relaxed">
                      {selectedReport.resumenClinico}
                    </p>
                  </div>

                  {/* Signals */}
                  {selectedReport.senalesDetectadas && selectedReport.senalesDetectadas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#6E6779] mb-1.5">
                        Señales y factores detectados:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedReport.senalesDetectadas.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#5A5464] border border-[#EFEAE1]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3.5 rounded-2xl bg-[#EDF9F0] border border-[#D4F2DC] text-xs text-[#2C693E]">
                    <span className="font-bold block mb-0.5">Pauta de Intervención:</span>
                    {selectedReport.recomendacion}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col gap-2">
                    {!selectedReport.atendido ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAttended(selectedReport.id)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#4E9B66] hover:bg-[#438758] transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Atendido</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs font-semibold text-[#327347] bg-[#E8F8EC] rounded-xl border border-[#D4F2DC]">
                        ✓ Atendido el {selectedReport.fechaAtencion ? new Date(selectedReport.fechaAtencion).toLocaleDateString('es-MX') : 'Recientemente'}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const pat = patients.find(p => p.id === selectedReport.pacienteId);
                        if (pat) {
                          setSelectedPatientId(pat.id);
                          onTabChange('rep');
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#7252C4] bg-[#F3EFFF] hover:bg-[#EAE1FD] border border-[#E7DCFE] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver historial completo del paciente</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-white border border-[#EFEAE1] rounded-3xl text-xs text-[#8E8799]">
                  Selecciona una alerta o reporte de la lista para ver el desglose clínico y las recomendaciones de intervención.
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* Tab: Pacientes List */}
      {activeTab === 'pacs' && (
        <section aria-labelledby="patients-title" className="space-y-6">
          <div>
            <h2 id="patients-title" className="text-lg font-bold text-[#2D2938]">
              Directorio de Pacientes Vinculados
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7485]">
              {patients.length} pacientes activos bajo tu supervisión clínica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(p => {
              const last = lastPatientRecord(p.id);
              const critical = isCriticalPatient(p.id);
              const patientAlerts = reports.filter(r => r.pacienteId === p.id && !r.atendido);

              return (
                <div
                  key={p.id}
                  className={`bg-white border rounded-3xl p-5 shadow-xs transition-colors flex flex-col justify-between ${
                    critical || patientAlerts.some(a => a.nivelGravedad === 'Alta')
                      ? 'border-[#FFD7DF] bg-[#FFF8F9]'
                      : 'border-[#EFEAE1]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-[#2D2938] text-sm">
                          {p.nombre} {p.apellidos}
                        </h3>
                        <span className="text-xs text-[#8A8394] font-mono">
                          {p.email}
                        </span>
                      </div>

                      {patientAlerts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B8445E] bg-[#FFE2E8] px-2.5 py-0.5 rounded-full border border-[#FFD7DF]">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          {patientAlerts.length} alerta{patientAlerts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="my-4 pt-3 border-t border-[#F5EFE6] text-xs">
                      {last ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{EMO_DATA[last.e]?.icon}</span>
                          <div>
                            <span className="font-semibold text-[#2D2938]">
                              {last.e} ({last.n}/5)
                            </span>
                            <span className="text-[#8E8799] block text-[11px]">
                              {timeAgoStr(last.t)} {last.nota ? `· "${last.nota}"` : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9A94A4] italic">Sin registros recientes</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        onTabChange('rep');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-2xl bg-[#F3EFFF] text-[#7252C4] hover:bg-[#EAE1FD] transition-colors border border-[#E7DCFE]"
                    >
                      <span>Expediente</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    {patientAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReport(patientAlerts[0]);
                          onTabChange('alertas');
                        }}
                        className="px-3 py-2.5 rounded-2xl bg-[#FFF0F3] text-[#B8445E] border border-[#FFD7DF] text-xs font-bold"
                        title="Ver alertas de este paciente"
                      >
                        🚨
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab: Reportes Mensuales */}
      {activeTab === 'rep' && (
        <section aria-labelledby="reports-title" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE1]">
            <div>
              <h2 id="reports-title" className="text-lg font-bold text-[#2D2938]">
                Reportes Clínicos Mensuales
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7485]">
                Análisis longitudinal de estados anímicos y respuestas emocionales
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={activePatientForReport?.id || ''}
                onChange={e => setSelectedPatientId(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-white border border-[#E8E2D8] rounded-xl text-[#2D2938]"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellidos}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handlePrintReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[#E8E2D8] bg-white text-[#4D4857] hover:bg-[#FAF8F5] transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#8C71D6]" aria-hidden="true" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {currentReport && currentReport.ok && currentReport.p ? (
            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Patient header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]">
                <div>
                  <h3 className="text-base font-bold text-[#2D2938]">
                    Expediente: {currentReport.p.nombre} {currentReport.p.apellidos}
                  </h3>
                  <p className="text-xs text-[#7A7485]">
                    {currentReport.p.email} · {currentReport.n || 0} registros en el período evaluado
                  </p>
                </div>
                <div className="text-xs text-[#8C71D6] font-semibold bg-[#F3EFFF] px-3 py-1 rounded-full border border-[#E7DCFE]">
                  Mes: {new Date(2026, selectedMonth).toLocaleDateString('es-MX', { month: 'long' })}
                </div>
              </div>

              {/* Distribution breakdown */}
              <div>
                <h4 className="text-xs font-bold text-[#6E6779] uppercase tracking-wider mb-3">
                  Distribución de Frecuencia Emocional
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(Object.keys(EMO_DATA) as EmotionType[]).map(e => {
                    const count = currentReport.c ? currentReport.c[e] || 0 : 0;
                    const pct = currentReport.n ? Math.round((count * 100) / currentReport.n) : 0;
                    const meta = EMO_DATA[e];

                    return (
                      <div key={e} className={`p-3 rounded-2xl border ${meta.borderPastel} ${meta.bgPastel} text-center`}>
                        <span className="text-2xl mb-1 block">{meta.icon}</span>
                        <span className={`text-xs font-bold ${meta.textPastel} block`}>
                          {e}
                        </span>
                        <span className="text-[11px] font-mono text-[#6E6779] tabular-nums font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed chronology table */}
              <div>
                <h4 className="text-xs font-bold text-[#6E6779] uppercase tracking-wider mb-3">
                  Registro Cronológico de Estados Anímicos
                </h4>
                {currentReport.r && currentReport.r.length > 0 ? (
                  <div className="border border-[#EFEAE1] rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#FAF7F2] border-b border-[#EFEAE1] text-[#6E6779]">
                          <th className="py-2.5 px-3 font-semibold">Fecha y Hora</th>
                          <th className="py-2.5 px-3 font-semibold">Emoción</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Intensidad</th>
                          <th className="py-2.5 px-3 font-semibold">Detonante</th>
                          <th className="py-2.5 px-3 font-semibold">Nota Reflexiva</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5EFE6]">
                        {currentReport.r.map((r, i) => (
                          <tr key={i} className="hover:bg-[#FAF8F5]">
                            <td className="py-2.5 px-3 text-[#7E7788] font-mono whitespace-nowrap">
                              {new Date(r.t).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#2D2938]">
                              <span className="mr-1.5">{EMO_DATA[r.e].icon}</span>
                              {r.e}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                              <span className={r.n >= 4 ? 'text-[#B8445E] font-bold' : 'text-[#4D4857]'}>
                                {r.n}/5
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#5A5464]">
                              {r.detonante || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[#5A5464] italic">
                              {r.nota ? `"${r.nota}"` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8799] italic py-6 text-center">
                    No se registran eventos emocionales para este paciente en el mes seleccionado.
                  </p>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-[#EFEAE1] rounded-3xl">
              <p className="text-sm text-[#7A7485]">Selecciona un paciente para visualizar su informe.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab: Mi Perfil Profesional */}
      {activeTab === 'perf' && (
        <section aria-labelledby="dr-profile" className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#EDF9F0] border-2 border-[#D4F2DC] flex items-center justify-center text-[#2C693E]">
                  <Stethoscope className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 id="dr-profile" className="text-lg font-bold text-[#2D2938]">
                      {user.nombre} {user.apellidos}
                    </h2>
                    {user.verificado ? (
                      <span className="text-[11px] bg-[#EDF9F0] text-[#2C693E] px-2.5 py-0.5 rounded-full font-semibold border border-[#D4F2DC] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#3D8556]" />
                        <span>Cédula Oficial Verificada</span>
                      </span>
                    ) : (
                      <span className="text-[11px] bg-[#FFFBEB] text-[#8C6910] px-2.5 py-0.5 rounded-full font-semibold border border-[#FDEEBA]">
                        En trámite de validación
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A7485] mt-0.5">
                    {user.esp || 'Psicología Clínica'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTabChange('suscripcion')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F3EFFF] text-[#7252C4] hover:bg-[#EAE1FD] border border-[#E7DCFE] transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Ver Suscripción</span>
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-4">
              <div>
                <dt className="text-[#868091] text-xs">Cédula Profesional Oficial</dt>
                <dd className="font-mono font-bold text-[#2D2938] mt-0.5 flex items-center gap-1.5">
                  <span>{user.cedula || '12345678'}</span>
                  <span className="text-[10px] bg-[#E8F8EC] text-[#2C693E] px-1.5 py-0.2 rounded font-mono">
                    SEP / DGP Activa
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-[#868091] text-xs">Institución de Egreso</dt>
                <dd className="font-semibold text-[#2D2938] mt-0.5">
                  {user.universidad || 'Universidad Nacional Autónoma de México (UNAM)'}
                </dd>
              </div>

              <div>
                <dt className="text-[#868091] text-xs">Año de Titulación</dt>
                <dd className="font-semibold text-[#2D2938] mt-0.5">
                  {user.anioGraduacion || 2018}
                </dd>
              </div>

              <div>
                <dt className="text-[#868091] text-xs">Acreditación Adjunta</dt>
                <dd className="font-mono text-xs text-[#6B6576] mt-0.5 flex items-center gap-1">
                  <span>📄 {user.documentoAcreditacionNombre || 'Cedula_Profesional_DGP.pdf'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-[#868091] text-xs">Correo Electrónico</dt>
                <dd className="font-semibold text-[#2D2938] mt-0.5">
                  {user.email}
                </dd>
              </div>

              <div>
                <dt className="text-[#868091] text-xs">Código de Vinculación para Pacientes</dt>
                <dd className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-sm text-[#8C71D6] bg-[#F3EFFF] px-2.5 py-0.5 rounded-lg border border-[#E7DCFE]">
                    {user.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-lg bg-[#FAF8F5] border border-[#EFEAE1] hover:bg-[#F3EFE9] transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-[#3D8556]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </dd>
              </div>
            </dl>

            <div className="mt-6 p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFEAE1] text-xs text-[#6B6576] leading-relaxed">
              <span className="font-bold text-[#2D2938] block mb-1">Guía para el profesional verificado:</span>
              Comparte tu código ({user.codigo}) con tus pacientes. Cuando se registren en la app,
              los reportes de gravedad y alertas generadas por el chatbot se enviarán en tiempo real a tu pestaña de <strong>Alertas IA</strong> y recibirás notificaciones nativas en tu pantalla.
            </div>
          </div>
        </section>
      )}

      {/* Tab: Suscripción & Facturación Mensual Redituable */}
      {activeTab === 'suscripcion' && (
        <section aria-labelledby="billing-title" className="space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE1]">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#8C71D6]" />
                <h2 id="billing-title" className="text-lg font-bold text-[#2D2938]">
                  Suscripción Mensual &amp; Modelo Rentable
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#7A7485] mt-0.5">
                Herramienta clínica de alto retorno de inversión: con solo 1 sesión al mes de 1 paciente, cubres el 100% del servicio y elevas la retención un 45%.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanToBuy(user.plan === 'ClinicaEquipo' ? 'ClinicaEquipo' : 'ConsultorioPro');
                  setIsCheckoutModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#8C71D6] hover:bg-[#7D61CC] rounded-2xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Actualizar / Cambiar Plan</span>
              </button>
            </div>
          </div>

          {/* Current Subscription Status Card */}
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs text-[#8E8799] uppercase font-bold tracking-wider block mb-1">
                  Tu Estado Actual
                </span>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-[#2D2938]">
                    {user.plan === 'ClinicaEquipo' ? 'Plan Clínica & Equipo Terapéutico' : 'Plan Consultorio Pro (Individual)'}
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    user.estadoSuscripcion === 'Activa'
                      ? 'bg-[#EDF9F0] text-[#2C693E] border-[#D4F2DC]'
                      : 'bg-[#FFFBEB] text-[#8C6910] border-[#FDEEBA]'
                  }`}>
                    {user.estadoSuscripcion === 'Activa' ? '✓ Suscripción Activa' : 'Prueba Gratuita (14 días)'}
                  </span>
                </div>
                <p className="text-xs text-[#746E80] mt-1.5 leading-relaxed">
                  Próxima fecha de corte / renovación:{' '}
                  <span className="font-semibold text-[#2D2938]">
                    {user.fechaFinSuscripcion ? new Date(user.fechaFinSuscripcion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '30 de Noviembre de 2026'}
                  </span>
                  {' '}· Facturación automática mensual mediante tarjeta terminación •••• {user.tarjetaUltimos4 || '4242'}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleAutoRenew}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    user.autoRenovar
                      ? 'bg-[#FAF8F5] text-[#5A5464] border-[#E8E2D8] hover:bg-[#F3EFE9]'
                      : 'bg-[#FFF0F3] text-[#B8445E] border-[#FFD7DF] hover:bg-[#FFE4EA]'
                  }`}
                >
                  {user.autoRenovar ? 'Desactivar auto-renovación' : 'Reactivar auto-renovación'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanToBuy('ClinicaEquipo');
                    setIsCheckoutModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8C71D6] text-white hover:bg-[#7D61CC] transition-colors shadow-xs"
                >
                  Mejorar a Clínica ($1,399 MXN)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Profitability / ROI Calculator for Psychologists */}
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#4E9B66]" />
              <h3 className="text-base font-bold text-[#2D2938]">
                Calculadora de Rentabilidad para tu Consultorio
              </h3>
            </div>
            <p className="text-xs text-[#746E80] leading-relaxed mb-6">
              Simula cómo impacta el uso de Felt.O en los ingresos de tu práctica privada.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Sliders (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#575162] mb-1.5">
                    <label htmlFor="roi-fee-slider">
                      ¿Cuánto cobras en promedio por sesión terapéutica?
                    </label>
                    <span className="font-bold text-[#8C71D6] font-mono text-sm">
                      ${roiSessionFee} MXN
                    </span>
                  </div>
                  <input
                    id="roi-fee-slider"
                    type="range"
                    min="350"
                    max="1800"
                    step="50"
                    value={roiSessionFee}
                    onChange={e => setRoiSessionFee(Number(e.target.value))}
                    className="w-full accent-[#8C71D6] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#8E8799] mt-1">
                    <span>$350 MXN (Social)</span>
                    <span>$800 MXN (Estándar)</span>
                    <span>$1,800 MXN (Especializada)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#575162] mb-1.5">
                    <label htmlFor="roi-pats-slider">
                      Número de pacientes activos que atiendes:
                    </label>
                    <span className="font-bold text-[#8C71D6] font-mono text-sm">
                      {roiPatientCount} pacientes
                    </span>
                  </div>
                  <input
                    id="roi-pats-slider"
                    type="range"
                    min="5"
                    max="40"
                    value={roiPatientCount}
                    onChange={e => setRoiPatientCount(Number(e.target.value))}
                    className="w-full accent-[#8C71D6] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#8E8799] mt-1">
                    <span>5 pacientes</span>
                    <span>20 pacientes</span>
                    <span>40 pacientes</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Math Box (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#EFEAE1] space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7485]">Ingreso mensual de tu consulta:</span>
                  <span className="font-bold font-mono text-[#2D2938]">
                    ${(roiPatientCount * roiSessionFee * roiSessionsPerMonth).toLocaleString('es-MX')} MXN
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7485]">Costo mensual Felt.O Pro:</span>
                  <span className="font-bold font-mono text-[#8C71D6]">
                    $499 MXN / mes
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#F5EFE6]">
                  <span className="font-bold text-[#2C693E]">Sesiones para cubrir el costo:</span>
                  <span className="font-bold font-mono text-sm text-[#2C693E] bg-[#EDF9F0] px-2.5 py-0.5 rounded-full border border-[#D4F2DC]">
                    {(499 / roiSessionFee).toFixed(2)} sesiones al mes
                  </span>
                </div>

                <p className="text-[11px] text-[#746E80] leading-relaxed pt-1">
                  💡 <strong>Conclusión de rentabilidad:</strong> Menos de <strong>1 sola sesión</strong> al mes cubre el 100% de la herramienta. Además, gracias al chatbot y monitoreo de crisis 24/7, la tasa de deserción se reduce un 45%, protegiendo más de <strong>${(roiSessionFee * 4).toLocaleString('es-MX')} MXN</strong> mensuales en pacientes que continúan su tratamiento.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Plan 1: Consultorio Pro */}
            <div className={`p-6 sm:p-7 rounded-3xl border transition-all shadow-xs flex flex-col justify-between ${
              user.plan !== 'ClinicaEquipo'
                ? 'bg-white border-[#8C71D6] ring-2 ring-[#EADDFE]'
                : 'bg-white border-[#EFEAE1]'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3EFFF] text-[#7252C4] border border-[#E7DCFE]">
                    Más Popular para Independientes
                  </span>
                  <span className="text-xs font-semibold text-[#3D8556]">
                    Rentabilidad Inmediata
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#2D2938]">
                  Plan Consultorio Pro
                </h3>
                <p className="text-xs text-[#746E80] mt-1">
                  Para psicólogos clínicos con práctica privada que buscan contención continua y triage automático.
                </p>

                <div className="my-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#2D2938] font-mono">
                    $499
                  </span>
                  <span className="text-xs font-semibold text-[#868091]">
                    MXN / mes (~$29 USD)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#575162] mb-6">
                  {PLANES_PRECIOS.ConsultorioPro.caracteristicas.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#3D8556] shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlanToBuy('ConsultorioPro');
                  setIsCheckoutModalOpen(true);
                }}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  user.plan !== 'ClinicaEquipo' && user.estadoSuscripcion === 'Activa'
                    ? 'bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC]'
                    : 'bg-[#8C71D6] hover:bg-[#7D61CC] text-white'
                }`}
              >
                {user.plan !== 'ClinicaEquipo' && user.estadoSuscripcion === 'Activa'
                  ? 'Plan Actual Activo'
                  : 'Contratar Consultorio Pro ($499 MXN)'}
              </button>
            </div>

            {/* Plan 2: Clínica & Equipo */}
            <div className={`p-6 sm:p-7 rounded-3xl border transition-all shadow-xs flex flex-col justify-between ${
              user.plan === 'ClinicaEquipo'
                ? 'bg-white border-[#8C71D6] ring-2 ring-[#EADDFE]'
                : 'bg-white border-[#EFEAE1]'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC]">
                    Para Clínicas y Equipos
                  </span>
                  <span className="text-xs font-semibold text-[#8C71D6]">
                    Escala Ilimitada
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#2D2938]">
                  Plan Clínica &amp; Equipo Terapéutico
                </h3>
                <p className="text-xs text-[#746E80] mt-1">
                  Para consultorios grupales, clínicas de salud mental e instituciones terapéuticas.
                </p>

                <div className="my-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#2D2938] font-mono">
                    $1,399
                  </span>
                  <span className="text-xs font-semibold text-[#868091]">
                    MXN / mes (~$79 USD)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#575162] mb-6">
                  {PLANES_PRECIOS.ClinicaEquipo.caracteristicas.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#3D8556] shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlanToBuy('ClinicaEquipo');
                  setIsCheckoutModalOpen(true);
                }}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  user.plan === 'ClinicaEquipo' && user.estadoSuscripcion === 'Activa'
                    ? 'bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC]'
                    : 'bg-[#2D2938] hover:bg-[#1E1B26] text-white'
                }`}
              >
                {user.plan === 'ClinicaEquipo' && user.estadoSuscripcion === 'Activa'
                  ? 'Plan Actual Activo'
                  : 'Contratar Plan Clínica ($1,399 MXN)'}
              </button>
            </div>

          </div>

          {/* Billing & Fiscal Invoices History (CFDI) */}
          <div className="bg-white border border-[#EFEAE1] rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div>
                <h3 className="text-base font-bold text-[#2D2938]">
                  Historial de Facturación y Comprobantes Fiscales
                </h3>
                <p className="text-xs text-[#7A7485]">
                  Comprobantes deducibles para tus declaraciones mensuales
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5A5464] border border-[#E8E2D8]">
                {user.facturas?.length || 1} factura(s) emitida(s)
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F5EFE6] text-[#868091] font-semibold">
                    <th scope="col" className="py-2.5 px-3">Folio Fiscal CFDI</th>
                    <th scope="col" className="py-2.5 px-3">Fecha</th>
                    <th scope="col" className="py-2.5 px-3">Plan Suscrito</th>
                    <th scope="col" className="py-2.5 px-3">Monto Pagado</th>
                    <th scope="col" className="py-2.5 px-3">Método</th>
                    <th scope="col" className="py-2.5 px-3 text-center">Estatus</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {(user.facturas && user.facturas.length > 0 ? user.facturas : [
                    {
                      id: 'FAC-2026-001',
                      fecha: Date.now() - 6 * 24 * 3600000,
                      monto: 499,
                      moneda: 'MXN',
                      plan: 'Plan Consultorio Pro (Individual)',
                      estado: 'Pagado',
                      folioFiscal: 'FELTO-CFDI-928174',
                      metodoPago: `Tarjeta terminación •••• ${user.tarjetaUltimos4 || '4242'}`
                    }
                  ]).map(f => (
                    <tr key={f.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-[#8C71D6]">
                        {f.folioFiscal}
                      </td>
                      <td className="py-3 px-3 text-[#5A5464]">
                        {new Date(f.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#2D2938]">
                        {f.plan}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#2D2938]">
                        ${f.monto} {f.moneda}
                      </td>
                      <td className="py-3 px-3 text-[#7A7485]">
                        {f.metodoPago}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF9F0] text-[#2C693E] border border-[#D4F2DC]">
                          ✓ {f.estado}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C71D6] hover:underline"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>
      )}

      {/* Checkout Payment Modal */}
      {isCheckoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A4553]/40 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white border border-[#EFEAE1] rounded-3xl w-full max-w-md shadow-xl overflow-hidden my-8">
            <div className="p-6 pb-4 border-b border-[#F5EFE6] flex items-center justify-between bg-[#FFFDF9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F3EFFF] border border-[#E7DCFE] flex items-center justify-center text-[#7252C4]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="checkout-modal-title" className="text-base font-bold text-[#2D2938]">
                    Activar Suscripción Mensual
                  </h3>
                  <p className="text-xs text-[#7A7485]">
                    {selectedPlanToBuy === 'ClinicaEquipo' ? 'Plan Clínica & Equipo' : 'Plan Consultorio Pro'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 text-[#9E97A8] hover:text-[#2D2938] rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Preview */}
            <div className="p-6 pb-2 space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2D2938] block">
                    {PLANES_PRECIOS[selectedPlanToBuy].nombre}
                  </span>
                  <span className="text-[11px] text-[#7A7485]">
                    Facturación mensual recurrente
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#2D2938] font-mono">
                    ${couponCode.toUpperCase() === 'FELTO20' ? Math.round(PLANES_PRECIOS[selectedPlanToBuy].precioMXN * 0.8) : PLANES_PRECIOS[selectedPlanToBuy].precioMXN} MXN
                  </span>
                  {couponCode.toUpperCase() === 'FELTO20' && (
                    <span className="text-[10px] text-[#3D8556] block font-semibold">
                      -20% cupón aplicado
                    </span>
                  )}
                </div>
              </div>

              {billingFeedbackMsg && (
                <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  billingFeedbackMsg.ok
                    ? 'bg-[#EDF9F0] border border-[#D4F2DC] text-[#2C693E]'
                    : 'bg-[#FFF0F3] border border-[#FFD7DF] text-[#B8445E]'
                }`}>
                  {billingFeedbackMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{billingFeedbackMsg.text}</span>
                </div>
              )}

              {/* Payment Card Form */}
              <form onSubmit={handleProcessPayment} className="space-y-3">
                <div>
                  <label htmlFor="card-holder" className="block text-xs font-semibold text-[#575162] mb-1">
                    Nombre del Titular
                  </label>
                  <input
                    id="card-holder"
                    type="text"
                    required
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    placeholder="Dra. Laura Méndez Ruiz"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C71D6]"
                  />
                </div>

                <div>
                  <label htmlFor="card-number" className="block text-xs font-semibold text-[#575162] mb-1">
                    Número de Tarjeta (16 dígitos)
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C71D6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card-exp" className="block text-xs font-semibold text-[#575162] mb-1">
                      Vencimiento (MM/AA)
                    </label>
                    <input
                      id="card-exp"
                      type="text"
                      required
                      maxLength={5}
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C71D6]"
                    />
                  </div>

                  <div>
                    <label htmlFor="card-cvv" className="block text-xs font-semibold text-[#575162] mb-1">
                      CVV
                    </label>
                    <input
                      id="card-cvv"
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C71D6]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="coupon-code" className="block text-xs font-semibold text-[#575162] mb-1">
                    Cupón de Descuento
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon-code"
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="FELTO20"
                      className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#2D2938] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C71D6]"
                    />
                    <span className="px-3 py-2 text-[11px] font-semibold text-[#3D8556] bg-[#EDF9F0] rounded-xl border border-[#D4F2DC]">
                      20% OFF
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#8C71D6] hover:bg-[#7D61CC] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isProcessingPayment
                        ? 'Procesando pago seguro...'
                        : `Pagar $${couponCode.toUpperCase() === 'FELTO20' ? Math.round(PLANES_PRECIOS[selectedPlanToBuy].precioMXN * 0.8) : PLANES_PRECIOS[selectedPlanToBuy].precioMXN} MXN y Activar`}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-[#8E8799] mt-2 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-[#3D8556]" />
                    <span>Pago cifrado SSL 256 bits · Cancela en cualquier momento sin penalizaciones</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dashboard Inicio (Default View) */}
      {activeTab === 'inicio' && (
        <div className="space-y-8">
          
          {/* KPI Cards Strip in Pastel */}
          <section aria-label="Indicadores clave clínicos" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-[#7A7485] block">
                Pacientes Activos
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-[#8C71D6] tabular-nums my-1 block">
                {patients.length}
              </span>
              <span className="text-[11px] text-[#9A94A4]">En seguimiento</span>
            </div>

            <div
              onClick={() => onTabChange('alertas')}
              className="bg-white border border-[#EFEAE1] hover:border-[#FFD7DF] rounded-3xl p-5 shadow-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7A7485] block">
                  Alertas IA del Chat
                </span>
                {unattendedHighCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#B8445E] animate-ping"></span>
                )}
              </div>
              <span className={`text-2xl sm:text-3xl font-bold tabular-nums my-1 block ${unattendedHighCount > 0 ? 'text-[#D45D79]' : 'text-[#8C71D6]'}`}>
                {unattendedReports.length}
              </span>
              <span className="text-[11px] text-[#9A94A4]">
                {unattendedHighCount} de gravedad alta
              </span>
            </div>

            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-[#7A7485] block">
                Sesiones Registradas
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-[#2D2938] tabular-nums my-1 block">
                {allPatientRecords.length}
              </span>
              <span className="text-[11px] text-[#9A94A4]">Histórico clínico</span>
            </div>

            <div className="bg-white border border-[#EFEAE1] rounded-3xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-[#7A7485] block">
                Balance Positivo
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-[#4E9B66] tabular-nums my-1 block">
                {positivePercentage}%
              </span>
              <span className="text-[11px] text-[#9A94A4]">Calma y Felicidad</span>
            </div>
          </section>

          {/* Recent AI Triage Alerts Box in Dashboard */}
          <section aria-labelledby="recent-alerts-title" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B8445E]" />
                <h2 id="recent-alerts-title" className="text-base font-bold text-[#2D2938]">
                  Últimos Reportes de Gravedad Enviados por el Chatbot
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onTabChange('alertas')}
                className="text-xs font-bold text-[#8C71D6] hover:underline"
              >
                Ver todas las alertas ({reports.length}) →
              </button>
            </div>

            <div className="divide-y divide-[#F5EFE6] mt-2">
              {reports.slice(0, 3).map(rep => (
                <div
                  key={rep.id}
                  onClick={() => {
                    setSelectedReport(rep);
                    onTabChange('alertas');
                  }}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF8F5] -mx-2 px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">
                      {rep.nivelGravedad === 'Alta' ? '🚨' : rep.nivelGravedad === 'Media' ? '📋' : '🌿'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            rep.nivelGravedad === 'Alta'
                              ? 'bg-[#FFF0F3] text-[#B8445E] border-[#FFD7DF]'
                              : rep.nivelGravedad === 'Media'
                              ? 'bg-[#FFF4EB] text-[#B8642A] border-[#FFE3CC]'
                              : 'bg-[#EDF9F0] text-[#327347] border-[#D4F2DC]'
                          }`}
                        >
                          Gravedad {rep.nivelGravedad}
                        </span>
                        <span className="text-xs font-bold text-[#2D2938]">
                          {rep.pacienteNombre}
                        </span>
                        {!rep.atendido ? (
                          <span className="text-[10px] text-[#B8445E] bg-[#FFE2E8] px-2 py-0.5 rounded-full font-bold">
                            Pendiente
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#327347] bg-[#E8F8EC] px-2 py-0.5 rounded-full">
                            ✓ Atendido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5A5464] mt-1 leading-relaxed">
                        {rep.resumenClinico}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-[#8C71D6] font-semibold flex items-center gap-1 justify-end">
                      <span>{EMO_DATA[rep.emocionDetectada]?.icon}</span>
                      <span>{rep.emocionDetectada}</span>
                    </span>
                    <time className="text-[11px] text-[#8E8799] font-mono">
                      {timeAgoStr(rep.fecha)}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2-Column Split: Active Patients & Global Emotion Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Patient quick triage list (7 cols) */}
            <div className="lg:col-span-7">
              <section aria-labelledby="triage-title" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
                  <h2 id="triage-title" className="text-base font-bold text-[#2D2938]">
                    Estado de Pacientes
                  </h2>
                  <button
                    type="button"
                    onClick={() => onTabChange('pacs')}
                    className="text-xs font-semibold text-[#8C71D6] hover:underline"
                  >
                    Ver todos ({patients.length})
                  </button>
                </div>

                <div className="divide-y divide-[#F5EFE6] mt-2">
                  {patients.map(p => {
                    const last = lastPatientRecord(p.id);
                    const crit = isCriticalPatient(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          onTabChange('rep');
                        }}
                        className={`py-3.5 px-3 -mx-3 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                          crit
                            ? 'bg-[#FFF8F9] hover:bg-[#FFF0F3]'
                            : 'hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F3EFFF] border border-[#EADDFE] flex items-center justify-center text-xs font-bold text-[#7252C4]">
                            {p.nombre.charAt(0)}{p.apellidos.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-[#2D2938]">
                                {p.nombre} {p.apellidos}
                              </span>
                              {crit && (
                                <span className="text-[10px] uppercase font-bold text-[#B8445E] bg-[#FFE2E8] px-2 py-0.5 rounded-full border border-[#FFD7DF]">
                                  Atención
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#868091] block">
                              Último: {last ? timeAgoStr(last.t) : 'Sin datos'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {last && (
                            <div className="text-right">
                              <span className="text-sm font-semibold text-[#2D2938] flex items-center gap-1 justify-end">
                                <span>{EMO_DATA[last.e]?.icon}</span>
                                <span>{last.e}</span>
                              </span>
                              <span className="text-[11px] text-[#8E8799] tabular-nums font-medium">
                                Intensidad {last.n}/5
                              </span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#A8A1B2]" aria-hidden="true" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right: Global Emotion Distribution (5 cols) */}
            <div className="lg:col-span-5">
              <section aria-labelledby="overview-dist" className="bg-white border border-[#EFEAE1] rounded-3xl p-6 shadow-xs">
                <h2 id="overview-dist" className="text-base font-bold text-[#2D2938] mb-1">
                  Panorama Emocional Global
                </h2>
                <p className="text-xs text-[#7A7485] mb-6">
                  Frecuencia de emociones en tu consultorio
                </p>

                <div className="space-y-3.5">
                  {(Object.keys(EMO_DATA) as EmotionType[]).map(e => {
                    const count = totalEmotionCounts[e] || 0;
                    const percent = allPatientRecords.length
                      ? Math.round((count * 100) / allPatientRecords.length)
                      : 0;
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
              </section>
            </div>

          </div>

        </div>
      )}

    </main>
  );
};
