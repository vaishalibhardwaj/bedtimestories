

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

async function createStoryAPI(name, color, animal) {
  try {
    const prompt = `Create a detailed and complete story about a character named ${name}, who loves the color ${color} and whose favorite animal is a ${animal}. The story should be engaging, appropriate for children, and around 500 words long. If you give less than 300 words then i will be sad.`;

    let story = "";
    let totalWords = 0;
    let maxIterations = 5; // Limit the number of iterations

    while (totalWords < 500 && maxIterations > 0) {
      const response = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        model: "gpt-4o-mini",
        max_tokens: 2000,
        temperature: 0.7,
        presence_penalty: 0.5,
        frequency_penalty: 0.5,
      });

      let newStoryPart = response.choices[0].message.content.trim();
      story += " " + newStoryPart;
      totalWords = countWords(story);

      if (totalWords >= 500) {
        story = truncateToWordLimit(story, 500);
      }

      maxIterations--;
    }

    return story.trim();
  } catch (error) {
    throw error;
  }
}

function truncateToWordLimit(text, limit) {
  const words = text.trim().split(/\s+/);
  if (words.length > limit) {
    return words.slice(0, limit).join(" ") + "...";
  }
  return text;
}