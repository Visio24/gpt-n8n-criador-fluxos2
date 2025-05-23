const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const N8N_TOKEN = process.env.N8N_TOKEN;

app.post('/criar-fluxo', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt é obrigatório.' });
  }

  try {
    const completion = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Você é um assistente que gera fluxos JSON válidos para serem usados no n8n.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const fluxoJSON = completion.data.choices[0].message.content;

    const createFlow = await axios.post('https://n8n-production-16c8.up.railway.app/rest/workflows',
      JSON.parse(fluxoJSON), {
      headers: {
        'Authorization': `Bearer ${N8N_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: 'Fluxo criado com sucesso no n8n.', fluxoId: createFlow.data.id });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao criar o fluxo no n8n.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

