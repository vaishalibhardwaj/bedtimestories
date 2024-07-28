const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const app = express();

const meow = 'sk-proj-DeOWUO16sNyaQVQjqxCGT3BlbkFJTziHLsIIklJm1Jvmpg06';
const openai = new OpenAI({ apiKey: meow });
const speechFile = path.resolve('./public/speech.mp3');

app.use(bodyParser.json());
app.use(express.static('public'));

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

function truncateToWordLimit(text, limit) {
  const words = text.trim().split(/\s+/);
  if (words.length > limit) {
    return words.slice(0, limit).join(' ') + '...';
  }
  return text;
}

function formatStory(story) {
  return story.replace(/#(\w+)/g, '**$1**');
}

app.post('/api/create-story', async (req, res) => {
  const { characterNames, characterDescriptions, adventure, theme } = req.body;

  console.log('Request Received:', req.body);

  const prompt = `Create a personalized bedtime story with the following details:
    - Character Names: ${characterNames}
    - Character Descriptions: ${characterDescriptions}
    - Adventure: ${adventure}
    - Theme: ${theme}
    The story should be engaging, appropriate for children, and exactly 500 words long. The story should be finished within 500 words and well-formatted with headings.`;

  const messages = [
    { role: 'system', content: 'You are a storyteller and finishes the story within 500 words' },
    { role: 'user', content: prompt }
  ];

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    let story = "";
    let totalWords = 0;
    let maxIterations = 5;

    while (totalWords < 500 && maxIterations > 0) {
      console.log('Request Payload to OpenAI:', {
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 3500,
        temperature: 0.7,
      });

      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${meow}`,
      });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 3000,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${meow}`,
          },
        }
      );

      let newStoryPart = response.data.choices[0].message.content.trim();
      const words = newStoryPart.split(' ');

      for (const word of words) {
        story += word + ' ';
        totalWords = countWords(story);
        res.write(word + ' ');

        if (totalWords >= 500) {
          story = truncateToWordLimit(story, 500);
          break;
        }
      }

      if (totalWords >= 500) {
        break;
      }

      maxIterations--;
    }

    res.end();
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.post('/api/convert-to-speech', async (req, res) => {
  const { story } = req.body;

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: story,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(speechFile, buffer);

    res.json({ audioUrl: '/speech.mp3' });
  } catch (error) {
    console.error('Error converting to speech:', error);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.get('/api/get-speech', (req, res) => {
  res.sendFile(speechFile);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});