/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({});
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

const SYSTEM_INSTRUCTION = `
Eres Felt.O, el tierno perrito blanco y compañero de apoyo emocional de una aplicación de psicología y bienestar mental.
Tu rol dual:
1. Hablas con el paciente con cariño incondicional, validando lo que siente sin juzgar, con ternura y serenidad (1 a 2 párrafos suaves).
2. Como asistente clínico, evalúas de forma experta la gravedad del malestar emocional para generar un reporte de triage automático para su psicólogo tratante.

CRITERIOS DE GRAVEDAD:
- "Alta" (Puntuación 4 o 5): Ideación suicida, autolesiones, desesperanza severa, sensación de desbordamiento incontrolable, ataques de pánico agudos o crisis que requiera atención inmediata.
- "Media" (Puntuación 2 o 3): Ansiedad situacional, tristeza persistente, duelo, problemas relacionales, insomnio, estrés laboral/académico moderado.
- "Baja" (Puntuación 1): Estados de calma, bienestar, gratitud, reflexiones cotidianas o desahogos leves.

DEBES RESPONDER EXCLUSIVAMENTE UN OBJETO JSON con esta estructura exacta:
{
  "reply": "Tu respuesta tierna, cariñosa y empática para el paciente en español con algún emoji dulce como 🐾 o 🌸...",
  "triage": {
    "nivelGravedad": "Baja" | "Media" | "Alta",
    "puntuacionRiesgo": 1 a 5,
    "emocionDetectada": "Feliz" | "Calma" | "Triste" | "Ansiedad" | "Miedo" | "Enojo",
    "resumenClinico": "Síntesis profesional de 1 o 2 oraciones para el expediente del psicólogo.",
    "senalesDetectadas": ["Señal o síntoma clave 1", "Señal 2"],
    "recomendacion": "Recomendación terapéutica para el psicólogo (ej. programar sesión de contención, ejercicios de respiración, etc.)"
  }
}
`;

function fallbackClassifier(lastUserMsg: string, userName?: string) {
  const lower = lastUserMsg.toLowerCase();

  const criticalKeywords = [
    'morir', 'suicid', 'no quiero vivir', 'matarme', 'autolesi', 'hacerme daño',
    'no puedo más', 'desesperad', 'asfixiando', 'insoportable', 'pánico', 'desborda', 'terminar con todo'
  ];

  const moderateKeywords = [
    'triste', 'llorar', 'llanto', 'ansiedad', 'miedo', 'angustia', 'pesadilla',
    'insomnio', 'abrumad', 'cansad', 'presión', 'pelea', 'discusión', 'enojo', 'rabia', 'sola', 'solo'
  ];

  let nivelGravedad: 'Baja' | 'Media' | 'Alta' = 'Baja';
  let puntuacionRiesgo = 1;
  let emocionDetectada: 'Feliz' | 'Calma' | 'Triste' | 'Ansiedad' | 'Miedo' | 'Enojo' = 'Calma';
  let resumenClinico = 'Paciente interactúa con el asistente reportando estado emocional general estable.';
  let senalesDetectadas = ['Interacción cotidiana'];
  let recomendacion = 'Mantener monitoreo habitual en consulta regular.';

  let reply = `Te escucho con todo mi cariño, ${userName || 'amigo/a'} 🐾. Lo que estás sintiendo en este momento es totalmente válido. Recuerda que no tienes que resolver todo de golpe; darte un momento para respirar ya es un gran paso. ¿Cómo se siente tu cuerpo ahora mismo?`;

  const isCritical = criticalKeywords.some(k => lower.includes(k));
  const isModerate = moderateKeywords.some(k => lower.includes(k));

  if (isCritical) {
    nivelGravedad = 'Alta';
    puntuacionRiesgo = 5;
    emocionDetectada = lower.includes('miedo') ? 'Miedo' : 'Triste';
    resumenClinico = 'Alerta de riesgo elevado: El paciente manifiesta angustia severa o expresiones de sobrecarga límite.';
    senalesDetectadas = ['Sobrecarga emocional crítica', 'Expresión de desbordamiento o desesperanza'];
    recomendacion = 'Prioridad alta: Se recomienda al psicólogo realizar contacto de seguimiento en las próximas 24 horas y evaluar red de apoyo.';
    reply = `Siento mucho que estés pasando por algo tan difícil y pesado en este momento 🌸🐾. Quiero que sepas que me importas mucho y que no estás solo/a. He generado una alerta prioritaria en el panel de tu psicólogo vinculado para que pueda darte seguimiento especial. Si sientes que la situación te desborda, recuerda que hay personas listas para ayudarte en las líneas de emergencia médica. ¿Te gustaría respirar conmigo unos segundos?`;
  } else if (isModerate) {
    nivelGravedad = 'Media';
    puntuacionRiesgo = 3;
    if (lower.includes('ansied') || lower.includes('miedo')) {
      emocionDetectada = 'Ansiedad';
      resumenClinico = 'El paciente reporta sintomatología de ansiedad, tensión o pensamientos acelerados.';
      senalesDetectadas = ['Tensión psicofísica', 'Inquietud o preocupación'];
      recomendacion = 'Revisar factores detonantes en la próxima sesión y reforzar pautas de respiración diafragmática.';
      reply = `Respira despacito conmigo 🌸. Inhala suave por la nariz... y suelta despacito por la boca. La ansiedad hace que los pensamientos vayan muy rápido, pero aquí y ahora estás a salvo. He anotado este momento en tu reporte para que tu psicólogo pueda apoyarte a profundizar en ello. Estoy contigo paso a pasito.`;
    } else if (lower.includes('enojo') || lower.includes('rabia')) {
      emocionDetectada = 'Enojo';
      resumenClinico = 'El paciente expresa frustración o enojo ante una situación reciente.';
      senalesDetectadas = ['Frustración', 'Tensión reactiva'];
      recomendacion = 'Explorar límites personales y técnicas de asertividad.';
      reply = `Es completamente comprensible que sientas enojo o frustración ✨. Tu emoción tiene una razón de ser y merece respeto. He dejado un registro en tu informe clínico para que lo platiquen en tu próxima sesión. Date permiso de suspirar hondo y soltar la tensión de las manos.`;
    } else {
      emocionDetectada = 'Triste';
      resumenClinico = 'El paciente expresa sentimientos de tristeza, desánimo o necesidad de acompañamiento.';
      senalesDetectadas = ['Desánimo', 'Cansancio emocional'];
      recomendacion = 'Fomentar la autocompasión y evaluar la calidad del descanso.';
      reply = `Siento mucho que sientas tristeza hoy. A veces el corazón necesita soltar y descansar. Yo me quedo aquí a tu lado cuidándote 🐾. He enviado una nota a tu expediente para que tu psicólogo lo tenga presente. Permítete descansar sin exigirte estar bien de inmediato.`;
    }
  } else {
    if (lower.includes('feliz') || lower.includes('bien') || lower.includes('alegr') || lower.includes('content')) {
      emocionDetectada = 'Feliz';
      resumenClinico = 'El paciente reporta estado de ánimo positivo y sensación de satisfacción o logro.';
      senalesDetectadas = ['Afecto positivo', 'Motivación'];
      recomendacion = 'Reforzar anclajes de bienestar y factores protectores de la salud mental.';
      reply = `¡Qué hermosa noticia! Me alegra tanto el corazón verte así ☀️🐾. Disfruta y saborea esta sensación de bienestar; he registrado este momento positivo en tu reporte clínico para celebrar tus avances.`;
    }
  }

  return {
    reply,
    triage: {
      nivelGravedad,
      puntuacionRiesgo,
      emocionDetectada,
      resumenClinico,
      senalesDetectadas,
      recomendacion
    }
  };
}

// Multi-turn chat endpoint with clinical triage
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userEmotion, userName } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un historial de mensajes válido' });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || '';

    // ZERO-LATENCY FAST-PATH: Situaciones críticas y de riesgo vital (ej. "me quiero morir", "me quiero suicidar", etc.)
    // Responde instantáneamente en < 1ms sin esperar latencia de red para contención inmediata
    const HIGH_CRISIS_REGEX = /(me quiero morir|me quiero suicidar|me quiero eliminar|no quiero vivir|acabar con mi vida|quitarme la vida|deseo morir|quiero morir|quiero desaparecer|hacerme da[ñn]o|matarme|cortarme|no vale la pena vivir|suicidio|no puedo m[aá]s con mi vida|terminar con todo|ya no aguanto m[aá]s|me quiero quitar la vida|no quiero existir)/i;

    if (HIGH_CRISIS_REGEX.test(lastUserMsg)) {
      return res.json({
        reply: `Por favor, detente un segundo y escúchame con todo mi corazón 🐾. Tu vida tiene un valor inmenso y me importas profundamente. Sé que el dolor se siente asfixiante e insoportable en este instante, pero no estás solo/a. He emitido de inmediato una alerta de emergencia al consultorio de tu psicólogo y aquí tienes apoyo directo y gratuito las 24 horas:\n\n• Línea de la Vida (gratuita 24/7): 800 911 2000\n• Emergencias Médicas Inmediatas: 911\n\nQuédate conmigo un momento, respira despacio y permítenos acompañarte. ¿Hay alguien de confianza cerca con quien puedas estar ahora?`,
        triage: {
          nivelGravedad: 'Alta',
          puntuacionRiesgo: 5,
          emocionDetectada: 'Triste',
          resumenClinico: `ALERTA CRÍTICA INMEDIATA: Paciente manifiesta ideación suicida o autolesiva explícita ("${lastUserMsg}"). Respuesta rápida de contención activada.`,
          senalesDetectadas: ['Ideación suicida / autolesiva explícita', 'Crisis aguda de desbordamiento', 'Riesgo vital elevado'],
          recomendacion: 'Protocolo de emergencia: Contactar inmediatamente al paciente y/o a su red de apoyo familiar. Valorar derivación a urgencias psiquiátricas.'
        },
        isFastPath: true
      });
    }

    // Try Gemini if client is available
    if (aiClient) {
      try {
        const contents = messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.6,
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        if (parsed.reply && parsed.triage) {
          return res.json({
            reply: parsed.reply,
            triage: parsed.triage
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini structured response parsing failed or unconfigured, using fallback:', geminiError?.message);
      }
    }

    // Fallback classification
    const fallbackResult = fallbackClassifier(lastUserMsg, userName);
    return res.json(fallbackResult);
  } catch (error: any) {
    console.error('Server error in /api/chat:', error);
    return res.status(500).json({
      reply: 'Aquí estoy contigo 🐾. Tómate una pausa y respira suavemente.',
      triage: {
        nivelGravedad: 'Media',
        puntuacionRiesgo: 3,
        emocionDetectada: 'Calma',
        resumenClinico: 'Interacción registrada durante contingencia de red.',
        senalesDetectadas: ['Consulta de apoyo'],
        recomendacion: 'Monitoreo preventivo estándar.'
      }
    });
  }
});

// Setup Vite development server middlewares or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Felt.O server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
