const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const app = express();

const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });
const speechFile = path.resolve('./public/speech.mp3');

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/create-story', async (req, res) => {
  const { name, favoriteColor, favoriteAnimal, theme } = req.body;

  const messages = [
    { role: 'system', content: 'You are a storyteller.' },
    { role: 'user', content: `Create a personalized bedtime story for a child named ${name}. Their favorite animal is a ${favoriteAnimal} and their favorite color is ${favoriteColor}. Theme: ${theme}.` }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );

    const story = response.data.choices[0].message.content.trim();

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: story,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(speechFile, buffer);

    res.json({ story });
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.get('/api/get-speech', (req, res) => {
  res.sendFile(speechFile);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

