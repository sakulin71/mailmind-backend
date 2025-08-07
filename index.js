const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'emailText es requerido' });
  }

  const systemPrompt = `Eres un asistente que resume correos y sugiere respuestas educadas, claras y concisas. Devuelve un JSON con las claves: "summary" y "reply".`;

  const userPrompt = \`Correo:\n\${emailText}\n\nGenera un resumen y una respuesta sugerida en formato JSON.\`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${OPENAI_API_KEY}\`
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

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return res.json(parsed);
    } catch {
      return res.json({ summary: content, reply: "" });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error al contactar OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en puerto \${PORT}\`);
});