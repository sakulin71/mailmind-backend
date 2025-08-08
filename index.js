import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post("/api/summarize", async (req, res) => {
  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: "emailText es requerido" });

const systemPrompt = `Eres un asistente de correo. Analiza el contenido, detecta automáticamente el idioma y responde en ese mismo idioma.
Debes devolver un resumen y una respuesta educada, clara y breve, ambos en el idioma original del correo.
Devuelve el resultado en formato JSON con las claves: "summary" y "reply". Por favor, responde SOLO con el JSON estrictamente.`;

const userPrompt = `Correo:\n"""${emailText}"""\n\nDevuelve el resumen y la respuesta sugerida en formato JSON.`;




  try {
    // Usamos fetch global (Node 18+). Render usa Node 22 así que está disponible.
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", response.status, text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Intentamos parsear JSON devuelto por el modelo
    try {
      const parsed = JSON.parse(content);
      return res.json(parsed);
    } catch {
      // Fallback: devolver el texto como summary
      return res.json({ summary: content, reply: "" });
    }
  } catch (err) {
    console.error("Error al llamar a OpenAI:", err);
    return res.status(500).json({ error: "Error al contactar OpenAI" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
