/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Paciente' | 'Psicólogo';

export type EmotionType = 'Feliz' | 'Calma' | 'Triste' | 'Ansiedad' | 'Miedo' | 'Enojo';

export type SeverityLevel = 'Baja' | 'Media' | 'Alta';

export type SubscriptionPlan = 'Gratuito' | 'ConsultorioPro' | 'ClinicaEquipo';

export type SubscriptionStatus = 'Activa' | 'Prueba' | 'Cancelada' | 'Vencida';

export interface BillingInvoice {
  id: string;
  fecha: number;
  monto: number;
  moneda: string;
  plan: string;
  estado: 'Pagado' | 'Pendiente';
  folioFiscal: string;
  metodoPago: string;
}

export interface User {
  id: number;
  rol: UserRole;
  nombre: string;
  apellidos: string;
  email: string;
  pass: string;
  codigo?: string;
  cedula?: string;
  esp?: string;
  psic?: number; // Linked psychologist user ID
  genero?: string;
  fechaNacimiento?: string;
  
  // Verificación profesional de Psicólogo Real
  universidad?: string;
  anioGraduacion?: number;
  verificado?: boolean;
  estadoVerificacion?: 'Verificado' | 'En revisión' | 'Rechazado';
  documentoAcreditacionNombre?: string;
  fechaVerificacion?: number;
  registroNacionalValidado?: boolean;

  // Suscripción y Cobro Mensual Redituable
  plan?: SubscriptionPlan;
  estadoSuscripcion?: SubscriptionStatus;
  fechaFinSuscripcion?: number;
  tarjetaUltimos4?: string;
  autoRenovar?: boolean;
  facturas?: BillingInvoice[];
}

export interface EmotionEntry {
  u: number;
  e: EmotionType;
  n: number; // 1 to 5
  t: number; // Timestamp ms
  nota?: string;
  detonante?: string;
}

export interface ChatEntry {
  id: number;
  u: number;
  e: EmotionType;
  res: string;
  t?: number;
  util?: boolean;
}

export interface ClinicalReport {
  id: string;
  pacienteId: number;
  pacienteNombre: string;
  psicologoId?: number;
  fecha: number;
  nivelGravedad: SeverityLevel;
  puntuacionRiesgo: number; // 1 to 5
  emocionDetectada: EmotionType;
  resumenClinico: string;
  senalesDetectadas: string[];
  recomendacion: string;
  fragmentoMensaje: string;
  atendido?: boolean;
  fechaAtencion?: number;
}

export interface Database {
  users: User[];
  emo: EmotionEntry[];
  chats: ChatEntry[];
  reportesClinicos: ClinicalReport[];
}

export interface TestResultItem {
  id: string;
  modulo: string;
  descripcion: string;
  entrada: string;
  esperado: string;
  obtenido: string;
  aprobado: boolean;
}
