/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CrisisDetectionResult {
  isCritical: boolean;
  score: number; // 1 a 5
  nivelGravedad: 'Baja' | 'Media' | 'Alta';
  matchedCategory?: string;
  matchedTrigger?: string;
  resumenClinico: string;
  senalesDetectadas: string[];
  recomendacion: string;
  immediateReply?: string;
}

/**
 * Normaliza el texto para maximizar la detección contra evasiones,
 * leetspeak, acentos, repetición de caracteres y variaciones ortográficas.
 */
export function normalizeCrisisText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.toLowerCase();

  // 1. Eliminar tildes y diacríticos
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 2. Normalizar leetspeak común usado en situaciones de crisis o censura
  text = text
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/\+/g, 't');

  // 3. Normalizar equivalencias fonéticas coloquiales (k -> qu/c)
  text = text.replace(/\bkiero\b/g, 'quiero');
  text = text.replace(/\bkieroo+\b/g, 'quiero');
  text = text.replace(/\bkite\b/g, 'quite');
  text = text.replace(/\bkitar\b/g, 'quitar');
  text = text.replace(/\bkitarme\b/g, 'quitarme');
  text = text.replace(/\bcn\b/g, 'con');
  text = text.replace(/\bd\b/g, 'de');
  text = text.replace(/\bpa\b/g, 'para');
  text = text.replace(/\bxa\b/g, 'para');
  text = text.replace(/\bq\b/g, 'que');

  // 4. Reducir letras repetidas ("moriiiir" -> "morir", "suicidaaaar" -> "suicidar")
  // Las vocales y consonantes que no sean 'r', 'l', 'c' deben colapsarse a 1 sola letra
  text = text.replace(/([aeioubdghjmnñpqstuvwxyz])\1+/g, '$1');
  text = text.replace(/([rlc])\1{2,}/g, '$1$1'); // para rr, ll, cc conservar max 2

  // 5. Sustituir caracteres no alfanuméricos por espacios limpios
  text = text.replace(/[^a-z0-9ñ\s]/g, ' ');

  // 6. Colapsar espacios múltiples
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Autómata léxico-semántico expandido con amplio catálogo de variables
 * para la detección inmediata de ideación de muerte, suicidio y desbordamiento crítico.
 */
export const CRISIS_PATTERNS: Array<{
  category: string;
  regex: RegExp;
  weight: number; // 4 o 5
}> = [
  // 1. Ideación suicida explícita y directa
  {
    category: 'Ideación Suicida Explícita',
    regex: /\b(me quiero suicidar|quiero suicidar|quiero suicidarme|deseo suicidar|deseo suicidarme|voy a suicidar|voy a suicidarme|me voy a suicidar|pienso en suicidar|pensando en suicidar|pensando en el suicidio|cometer suicidio|intentar suicidar|intento de suicidio|me suicido|me suicidare|tengo ganas de suicidar|suisidarme|suisidio|suicidarme ya|suicidarme pronto|suicidio)\b/i,
    weight: 5
  },

  // 2. Deseo explícito de muerte y morir
  {
    category: 'Deseo Explícito de Muerte',
    regex: /\b(me quiero morir|quiero morir|quiero morirme|deseo morir|deseo morirme|tengo ganas de morir|ganas de morirme|morir ya|morirme ya|morir ya no aguanto|morirme ya no aguanto|prefiero morir|prefiero morirme|mejor morir|mejor morirme|estaria mejor muerto|estaria mejor muerta|ojala estuviera muerto|ojala estuviera muerta|ojala me muera|quisiera morirme|desearia morir|desearia morirme|desearia estar muerto|desearia no haber nacido|seria mejor si no hubiera nacido|no debi nacer|no debi haber nacido|me voy a morir a proposito|ya me quiero morir|solo quiero morir|morir es mejor|ganas de morirme)\b/i,
    weight: 5
  },

  // 3. Eliminar / Borrar la propia existencia
  {
    category: 'Eliminación / Desaparición de la Existencia',
    regex: /\b(me quiero eliminar|quiero eliminarme|voy a eliminarme|me voy a eliminar|eliminarme de este mundo|borrarme de este mundo|borrar mi existencia|dejar de existir|no quiero existir|ya no quiero existir|no existir mas|deseo desaparecer|quiero desaparecer|desaparecer para siempre|desaparecer del mundo|extinguir mi vida|anular mi existencia|irme para siempre de este mundo)\b/i,
    weight: 5
  },

  // 4. Quitarse o acabar con la vida / Poner fin a todo
  {
    category: 'Cese de la Vida / Término Letal',
    regex: /\b(quitarme la vida|me quiero quitar la vida|voy a quitarme la vida|me voy a quitar la vida|acabar con mi vida|quiero acabar con mi vida|acabar con todo|quiero acabar con todo|terminar con mi vida|terminar con todo|quiero terminar con todo|ponerle fin a mi vida|poner fin a mi vida|ponerle fin a todo|poner fin a todo|ponerle fin a mi sufrimiento|dar fin a mi vida|darle fin a mi vida|cortar con mi vida|no seguir con esta vida)\b/i,
    weight: 5
  },

  // 5. Matarse / Atentar contra la propia integridad vital
  {
    category: 'Acción Autolítica Directa',
    regex: /\b(matarme|me quiero matar|quiero matarme|me voy a matar|voy a matarme|deseo matarme|matarme ya|matarme de una vez|auto matarme|voy a autodestruirme|liquidarme)\b/i,
    weight: 5
  },

  // 6. Métodos letales: Ahorcamiento / Asfixia
  {
    category: 'Método Letal: Ahorcamiento o Asfixia',
    regex: /\b(ahorcarme|quiero ahorcarme|me voy a ahorcar|colgarme|quiero colgarme|me voy a colgar|soga al cuello|ponerme una soga|colgarme de una cuerda|ahorcar|asfixiarme a proposito|ahogarme en el agua|tirarme al rio para ahogarme)\b/i,
    weight: 5
  },

  // 7. Métodos letales: Precipitación / Impacto
  {
    category: 'Método Letal: Precipitación o Tránsito',
    regex: /\b(tirarme de un puente|tirarme de un edificio|tirarme al vacio|lanzarme de un puente|lanzarme al vacio|saltar de un puente|saltar al vacio|brincar de un puente|tirarme a las vias|tirarme al metro|lanzarme a las vias|lanzarme al metro|lanzarme al tren|aventar al metro|aventarme al metro|aventarme de un puente|aventarme a un carro|aventar a las vias|tirarme debajo de un carro)\b/i,
    weight: 5
  },

  // 8. Métodos letales: Intoxicación / Sobredosis / Veneno
  {
    category: 'Método Letal: Intoxicación / Sobredosis',
    regex: /\b(sobredosis|empastillarme|atascarme de pastillas|tomar pastillas para morir|tomar pastillas para no despertar|tomarme todas las pastillas|tomarme una caja de pastillas|tomar veneno|envenenarme|ingerir veneno|tomar raticida|tomar cloro para morir)\b/i,
    weight: 5
  },

  // 9. Métodos letales: Autolesiones graves / Exanguinación / Armas
  {
    category: 'Método Letal: Autolesión Severa o Armas',
    regex: /\b(cortarme las venas|cortarme las munecas|desangrarme|desangrarme hasta morir|rebanarme las venas|abrirme las venas|pegarme un tiro|darme un tiro|dispararme en la cabeza|un balazo en la cabeza|pegarme un balazo)\b/i,
    weight: 5
  },

  // 10. Deseo de no despertar / Sueño eterno
  {
    category: 'Deseo de Inexistencia / Sueño Eterno',
    regex: /\b(dormir y no despertar|dormir para no despertar|dormir y no volver a despertar|dormirme para siempre|dormir para siempre|no quiero despertar nunca|no quiero volver a despertar|no despertar jamas|cerrar los ojos y no despertar)\b/i,
    weight: 5
  },

  // 11. Notas de despedida y sensación de ser una carga
  {
    category: 'Despedida Final o Carga Percibida',
    regex: /\b(carta de despedida|nota de despedida|carta de suicidio|dejar mi carta de despedida|adios a todos para siempre|adios a todos por siempre|esta es mi despedida|perdonenme por todo adios|hasta nunca mundo|gracias por todo adios para siempre|estarian mejor sin mi|estarian todos mejor sin mi|el mundo estaria mejor sin mi|mi familia estaria mejor sin mi|solo soy una carga y prefiero morir|soy un estorbo mejor no estar vivo)\b/i,
    weight: 5
  },

  // 12. Pérdida total del sentido y desesperanza extrema
  {
    category: 'Desesperanza Extrema y Límite Vital',
    regex: /\b(no vale la pena vivir|no vale la pena seguir viviendo|no vale la pena seguir vivo|no vale la pena seguir viva|para que vivir|para que seguir viviendo|para que seguir vivo|para que seguir viva|no tiene sentido mi vida|mi vida no vale nada|ya no quiero vivir|no quiero vivir mas|no quiero seguir viviendo|no aguanto vivir|no soporto vivir|ya no puedo con esta vida|no puedo mas con mi vida|el dolor es insoportable quiero morir|la unica salida es la muerte|la muerte es mi unica opcion|la unica solucion es morir)\b/i,
    weight: 4
  },

  // 13. Autolesiones generales con angustia alta
  {
    category: 'Autolesión / Daño Físico Inminente',
    regex: /\b(hacerme dano|lastimarme feo|cortarme el cuerpo|mutilarme|golpearme hasta sangrar|quemarme a proposito)\b/i,
    weight: 4
  }
];

/**
 * Evalúa cualquier texto utilizando el autómata de detección profunda de crisis.
 * Retorna un diagnóstico clínico completo listo para triage instantáneo en 0ms.
 */
export function evaluarCrisisMuerte(rawText: string): CrisisDetectionResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isCritical: false,
      score: 1,
      nivelGravedad: 'Baja',
      resumenClinico: 'Sin contenido detectable.',
      senalesDetectadas: [],
      recomendacion: 'Monitoreo habitual.'
    };
  }

  const normalized = normalizeCrisisText(rawText);

  // Recorrer el autómata de patrones clínicos
  for (const pattern of CRISIS_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const triggerPhrase = match[0];
      const isLevel5 = pattern.weight >= 5;

      return {
        isCritical: true,
        score: pattern.weight,
        nivelGravedad: 'Alta',
        matchedCategory: pattern.category,
        matchedTrigger: triggerPhrase,
        resumenClinico: `ALERTA CRÍTICA INMEDIATA (${pattern.category}): El paciente expresa ideación de alto riesgo ("${triggerPhrase}"). Protocolo de contención y notificación nativa activado.`,
        senalesDetectadas: [
          pattern.category,
          `Expresión crítica detectada: "${triggerPhrase}"`,
          'Riesgo vital elevado que requiere intervención prioritaria'
        ],
        recomendacion: 'Protocolo de emergencia: Contactar inmediatamente al paciente y/o a su red de apoyo familiar. Valorar derivación prioritaria a urgencias psiquiátricas.',
        immediateReply: `Por favor, detente un segundo y escúchame con todo mi corazón 🐾. Tu vida tiene un valor inmenso y me importas profundamente. Sé que el dolor se siente asfixiante e insoportable en este instante, pero no estás solo/a. He emitido de inmediato una alerta de emergencia al consultorio de tu psicólogo y aquí tienes apoyo directo y gratuito las 24 horas:\n\n• Línea de la Vida (gratuita 24/7): 800 911 2000\n• Emergencias Médicas Inmediatas: 911\n\nQuédate conmigo un momento, respira despacio y permítenos acompañarte. ¿Hay alguien de confianza cerca con quien puedas estar ahora?`
      };
    }
  }

  // Si no coincide con patrones de gravedad alta, evaluar malestar moderado
  const isModerateAnxiety = /\b(ansiedad|panico|desesperad[oa]|abrumad[oa]|no puedo respirar|llanto|angustia|angustiad[oa]|depresion|tristeza profunda|soledad)\b/i.test(normalized);

  if (isModerateAnxiety) {
    return {
      isCritical: false,
      score: 3,
      nivelGravedad: 'Media',
      matchedCategory: 'Malestar Emocional Moderado',
      resumenClinico: 'El paciente reporta sintomatología de ansiedad, angustia o tristeza que requiere contención afectiva.',
      senalesDetectadas: ['Malestar emocional moderado', 'Inquietud o sobrecarga situacional'],
      recomendacion: 'Realizar ejercicios de respiración 4-4-6 y dar seguimiento en sesión regular.'
    };
  }

  return {
    isCritical: false,
    score: 1,
    nivelGravedad: 'Baja',
    resumenClinico: 'Interacción de acompañamiento emocional cotidiano.',
    senalesDetectadas: ['Interacción cotidiana'],
    recomendacion: 'Mantener seguimiento en consulta regular.'
  };
}
