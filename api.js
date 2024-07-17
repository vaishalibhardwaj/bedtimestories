const axios = require('axios');
const OpenAI = require('openai');

const axiosInstance = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createStoryAPI(messages) {
  try {
    const response = await axiosInstance.post('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createStoryAPI,
};


