/* ========================================
   AI SERVICE (OpenAI) - Taurus v12.5 🤖
   ======================================== */

/**
 * Módulo para gerenciar chamadas à API da OpenAI.
 * Focado em economia de tokens e privacidade.
 */

const STORAGE_KEY = "taurus_openai_key";

/**
 * Salva a chave da OpenAI no dispositivo local
 */
export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key);
}

/**
 * Recupera a chave salva
 */
export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

/**
 * Função genérica para chamar a OpenAI (ChatGPT-3.5-Turbo ou 4o-mini)
 * Usaremos o modelo "gpt-4o-mini" por ser mais barato e inteligente.
 */
async function callOpenAI(prompt, text, maxTokens = 500) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key não configurada!");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente de escrita profissional. Responda apenas com o texto processado, sem comentários ou introduções." },
        { role: "user", content: `${prompt}\n\nTexto:\n${text}` }
      ],
      temperature: 0.5,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || "Erro na chamada da OpenAI.");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Ações Específicas
 */

export async function improveText(text) {
  return callOpenAI("Melhore a fluidez, gramática e profissionalismo deste texto, mantendo o sentido original.", text);
}

export async function summarizeText(text) {
  return callOpenAI("Resuma este texto de forma concisa em tópicos ou parágrafo curto.", text, 200);
}

export async function changeTone(text, tone = "formal") {
  const prompt = tone === "formal" 
    ? "Transforme este texto para um tom formal, profissional e polido (ideal para e-mails de trabalho)."
    : "Transforme este texto para um tom informal, amigável e descontraído (ideal para mensagens rápidas).";
  
  return callOpenAI(prompt, text);
}
