import express from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluarCrisisMuerte } from './src/lib/triageAutomaton.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = cliPort || (process.env.NODE_ENV === 'production' ? (Number(process.env.PORT) || 3000) : 3000);

app.use(express.json());

// Initialize GoogleGenAI client with official User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// DUAL GEMINI PIPELINE ARCHITECTURE (Separación para Alta Eficiencia)
// -------------------------------------------------------------

// Pipeline 1: Instrucción exclusiva para el Chat Afectivo y Empático (Felt.O)
// Se concentra 100% en ternura, brevedad y acompañamiento en texto plano.
const SYSTEM_INSTRUCTION_CHAT = `
Eres Felt.O, el tierno cachorro blanco y compañero de apoyo emocional de una aplicación de bienestar.
Tu misión exclusiva:
- Hablarle a {userName} con cariño incondicional, validación afectiva, serenidad y ternura.
- Escribir en un lenguaje suave y acogedor en español (máximo 1 o 2 párrafos breves).
- Incluir un emoji tierno como 🐾, 🌸 o ✨.
- NO generes formatos JSON, ni diagnósticos clínicos, ni menciones escalas numéricas; tu único papel es ser un amigo perrito dulce, seguro y empático.
`;

// Pipeline 2: Instrucción exclusiva para el Triage Clínico y Reporte para Psicólogos
// Se concentra 100% en evaluación diagnóstica, severidad y generación de informe estructurado.
const SYSTEM_INSTRUCTION_TRIAGE = `
Eres un evaluador y clasificador clínico psiquiátrico de triage que genera reportes automatizados para el expediente del psicólogo tratante.
Tu misión exclusiva:
- Analizar el estado emocional del paciente y los mensajes recientes para clasificar factores de riesgo y gravedad:
  * "Alta" (Puntuación 4 o 5): Ideación suicida, autolesiones, crisis aguda, desesperanza severa, desbordamiento incontrolable.
  * "Media" (Puntuación 2 o 3): Ansiedad, tristeza persistente, estrés moderado, insomnio, duelo, conflicto relacional.
  * "Baja" (Puntuación 1): Estabilidad anímica, afecto positivo, calma, reflexión cotidiana o desahogo leve.
- Generar un informe conciso y profesional siguiendo estrictamente el esquema JSON indicado.
`;

// Esquema estructurado para el reporte clínico
const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nivelGravedad: {
      type: Type.STRING,
      description: 'Nivel de gravedad clínica: Baja, Media o Alta'
    },
    puntuacionRiesgo: {
      type: Type.INTEGER,
      description: 'Puntuación de riesgo de 1 a 5'
    },
    emocionDetectada: {
      type: Type.STRING,
      description: 'Emoción detectada: Feliz, Calma, Triste, Ansiedad, Miedo o Enojo'
    },
    resumenClinico: {
      type: Type.STRING,
      description: 'Síntesis profesional de 1 o 2 oraciones para el expediente del psicólogo'
    },
    senalesDetectadas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Señales de alerta o síntomas clave detectados'
    },
    recomendacion: {
      type: Type.STRING,
      description: 'Recomendación terapéutica para el psicólogo'
    }
  },
  required: ['nivelGravedad', 'puntuacionRiesgo', 'emocionDetectada', 'resumenClinico', 'senalesDetectadas', 'recomendacion']
};

function fallbackChatReply(lastUserMsg: string, userName?: string): string {
  const lower = lastUserMsg.toLowerCase();
  const name = userName || 'amigo/a';

  if (lower.includes('feliz') || lower.includes('bien') || lower.includes('alegr') || lower.includes('gracias')) {
    return `¡Qué alegría tan linda leerte así, ${name}! ☀️🐾 Saborear estos momentos de calma nutre profundamente tu corazón. Yo aquí me quedo contigo celebrando tu día.`;
  }
  if (lower.includes('ansied') || lower.includes('miedo') || lower.includes('abrumad') || lower.includes('panico')) {
    return `Respira despacito conmigo, ${name} 🐾🌸. Inhala hondo... sostén un instante... y suelta el aire despacio. La ansiedad hace que todo parezca urgente, pero aquí y ahora estás a salvo. Tómate el tiempo que necesites.`;
  }
  if (lower.includes('triste') || lower.includes('llorar') || lower.includes('angustia') || lower.includes('sol')) {
    return `Siento mucho que tu corazón esté pasando por un momento pesado, ${name} 🐾. A veces descansar y desahogarse es lo que más necesitamos. No tienes que fingir estar bien; yo me quedo aquí a tu lado haciéndote compañía.`;
  }

  return `Te escucho con muchísima ternura, ${name} 🐾. Tómate una pausa suave; este es tu espacio seguro para expresar lo que sientes a tu propio ritmo. ¿Cómo se siente tu cuerpo en este momento?`;
}

function fallbackTriageOnly(lastUserMsg: string, userName?: string) {
  const crisisEval = evaluarCrisisMuerte(lastUserMsg);
  if (crisisEval.isCritical) {
    return {
      nivelGravedad: crisisEval.nivelGravedad,
      puntuacionRiesgo: crisisEval.score,
      emocionDetectada: 'Triste',
      resumenClinico: crisisEval.resumenClinico,
      senalesDetectadas: crisisEval.senalesDetectadas,
      recomendacion: crisisEval.recomendacion
    };
  }

  const lower = lastUserMsg.toLowerCase();
  const isModerate = /(ansiedad|panico|desesperad|abrumad|no puedo respirar|llanto|angustia|tristeza|miedo|enojo)/i.test(lower);
  const isPositive = /(feliz|bien|content|alegr|agradecid|tranquil|calma)/i.test(lower);

  if (isModerate) {
    const isFearOrAnxiety = lower.includes('ansied') || lower.includes('miedo') || lower.includes('panico');
    return {
      nivelGravedad: 'Media',
      puntuacionRiesgo: 3,
      emocionDetectada: isFearOrAnxiety ? 'Ansiedad' : 'Triste',
      resumenClinico: 'El paciente reporta sintomatología de ansiedad, angustia o desánimo que amerita contención afectiva.',
      senalesDetectadas: ['Malestar emocional moderado', 'Sobrecarga o tensión reactiva'],
      recomendacion: 'Revisar factores detonantes en la próxima sesión y reforzar técnica 4-4-6.'
    };
  }

  if (isPositive) {
    return {
      nivelGravedad: 'Baja',
      puntuacionRiesgo: 1,
      emocionDetectada: 'Feliz',
      resumenClinico: 'El paciente manifiesta estado de ánimo constructivo, estabilidad afectiva y gratitud.',
      senalesDetectadas: ['Afecto positivo', 'Recursos protectores estables'],
      recomendacion: 'Consolidar rutinas de autocuidado y reforzar anclajes de bienestar.'
    };
  }

  return {
    nivelGravedad: 'Baja',
    puntuacionRiesgo: 2,
    emocionDetectada: 'Calma',
    resumenClinico: 'Interacción de diálogo y desahogo cotidiano sin indicadores agudos de riesgo.',
    senalesDetectadas: ['Contacto habitual'],
    recomendacion: 'Mantener seguimiento en consulta regular.'
  };
}

// Sub-función 1: Generación rápida de respuesta conversacional (Felt.O)
async function generarRespuestaChatFeltO(contents: any[], lastUserMsg: string, userName?: string): Promise<string> {
  if (!aiClient) return fallbackChatReply(lastUserMsg, userName);

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CHAT.replace('{userName}', userName || 'amigo/a'),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const text = response.text?.trim();
    if (text) return text;
  } catch (err: any) {
    console.warn('API 1 (Felt.O Chat) fallback:', err?.message);
  }

  return fallbackChatReply(lastUserMsg, userName);
}

// Sub-función 2: Generación en paralelo del Triage Clínico y Reporte Estructurado
async function generarReporteTriageClinico(contents: any[], lastUserMsg: string, userName?: string) {
  if (!aiClient) return fallbackTriageOnly(lastUserMsg, userName);

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TRIAGE,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: TRIAGE_RESPONSE_SCHEMA
      }
    });

    const raw = response.text?.trim() || '';
    const parsed = JSON.parse(raw);
    if (parsed.nivelGravedad && parsed.puntuacionRiesgo) {
      return parsed;
    }
  } catch (err: any) {
    console.warn('API 2 (Triage Clínico) fallback:', err?.message);
  }

  return fallbackTriageOnly(lastUserMsg, userName);
}

// Endpoint 1: Chat conversacional ultra-rápido (Respuesta inmediata de Felt.O)
app.post('/api/chat/fast', async (req, res) => {
  try {
    const { messages, userName } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un historial de mensajes válido' });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || '';
    const crisisEval = evaluarCrisisMuerte(lastUserMsg);

    if (crisisEval.isCritical) {
      return res.json({
        reply: crisisEval.immediateReply,
        isFastPath: true
      });
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const reply = await generarRespuestaChatFeltO(contents, lastUserMsg, userName);
    return res.json({ reply });
  } catch (error: any) {
    return res.status(500).json({ reply: 'Aquí estoy contigo 🐾. Respira con calma y cuenta conmigo.' });
  }
});

// Endpoint 2: Triage Clínico independiente (Evaluación para el psicólogo)
app.post('/api/triage', async (req, res) => {
  try {
    const { messages, userName } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un historial de mensajes válido' });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || '';
    const crisisEval = evaluarCrisisMuerte(lastUserMsg);

    if (crisisEval.isCritical) {
      return res.json({
        triage: {
          nivelGravedad: crisisEval.nivelGravedad,
          puntuacionRiesgo: crisisEval.score,
          emocionDetectada: 'Triste',
          resumenClinico: crisisEval.resumenClinico,
          senalesDetectadas: crisisEval.senalesDetectadas,
          recomendacion: crisisEval.recomendacion
        },
        isFastPath: true
      });
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const triage = await generarReporteTriageClinico(contents, lastUserMsg, userName);
    return res.json({ triage });
  } catch (error: any) {
    return res.status(500).json({
      triage: {
        nivelGravedad: 'Media',
        puntuacionRiesgo: 3,
        emocionDetectada: 'Calma',
        resumenClinico: 'Reporte generado en contingencia de red.',
        senalesDetectadas: ['Consulta general'],
        recomendacion: 'Monitoreo preventivo estándar.'
      }
    });
  }
});

// Endpoint Principal /api/chat:
// Ejecuta ambos modelos de Gemini en PARALELO concurrente (Dual Pipeline)
// Multiplica la velocidad y reduce la latencia a una fracción del tiempo anterior.
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userEmotion, userName } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un historial de mensajes válido' });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || '';

    // ZERO-LATENCY FAST-PATH: Situaciones críticas de riesgo vital con autómata expandido (0ms)
    const crisisEval = evaluarCrisisMuerte(lastUserMsg);

    if (crisisEval.isCritical) {
      return res.json({
        reply: crisisEval.immediateReply || `Por favor, detente un segundo y escúchame con todo mi corazón 🐾. Tu vida tiene un valor inmenso y me importas profundamente. He emitido de inmediato una alerta de emergencia al consultorio de tu psicólogo y aquí tienes apoyo directo y gratuito las 24 horas: Línea de la Vida 800 911 2000 o Emergencias 911.`,
        triage: {
          nivelGravedad: crisisEval.nivelGravedad,
          puntuacionRiesgo: crisisEval.score,
          emocionDetectada: 'Triste',
          resumenClinico: crisisEval.resumenClinico,
          senalesDetectadas: crisisEval.senalesDetectadas,
          recomendacion: crisisEval.recomendacion
        },
        isFastPath: true
      });
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // EJECUCIÓN PARALELA CONCURRENTE DE LOS DOS MODELOS ESPECIALIZADOS
    // Ambas promesas corren a la vez en la nube de Google, reduciendo la latencia drásticamente
    const [reply, triage] = await Promise.all([
      generarRespuestaChatFeltO(contents, lastUserMsg, userName),
      generarReporteTriageClinico(contents, lastUserMsg, userName)
    ]);

    return res.json({
      reply,
      triage,
      pipeline: 'dual-parallel-gemini'
    });
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
