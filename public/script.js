


function convertMarkdownToHtml(text) {
  return text
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')  // Level 1 heading
    .replace(/^## (.*)$/gm, '<h2>$1</h2>') // Level 2 heading
    .replace(/^### (.*)$/gm, '<h3>$1</h3>') // Level 3 heading (if needed)
    .replace(/^(#### (.*))$/gm, '<h4>$1</h4>') // Level 4 heading (if needed)
    .replace(/^(##### (.*))$/gm, '<h5>$1</h5>') // Level 5 heading (if needed)
    .replace(/^(###### (.*))$/gm, '<h6>$1</h6>') // Level 6 heading (if needed)
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\*(.*)\*/g, '<em>$1</em>'); // Italic text (if needed)
}

async function createStory() {
  const adventure = document.getElementById('adventure').value;
  const theme = document.getElementById('theme').value;

  const characterNamesTags = Array.from(document.getElementsByClassName('character-name-tag')).map(tag => tag.textContent);
  const characterDescriptionsTags = Array.from(document.getElementsByClassName('character-description-tag')).map(tag => tag.textContent);

  // Show the loading indicator for the story
  document.getElementById('story-loading').classList.add('show');
  document.getElementById('story').innerHTML = '';

  try {
    const response = await fetch('/api/create-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        characterNames: characterNamesTags.join(', '), 
        characterDescriptions: characterDescriptionsTags.join(', '), 
        adventure, 
        theme 
      })
    });

    if (!response.ok) {
      console.error('Failed to create story');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let story = '';

    const updateStory = (chunk) => {
      story += chunk;
      document.getElementById('story').innerHTML = convertMarkdownToHtml(story);
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // Split the chunk into words and update the story one word at a time
      const words = chunk.split(' ');
      for (const word of words) {
        updateStory(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 50)); // Adjust the delay as needed
      }
    }

    // Hide the story loading indicator
    document.getElementById('story-loading').classList.remove('show');

    // Convert the displayed story to speech
    document.getElementById('audio-loading').classList.add('show');

    const speechResponse = await fetch('/api/convert-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ story })
    });

    if (!speechResponse.ok) {
      console.error('Failed to convert story to speech');
      return;
    }

    const { audioUrl } = await speechResponse.json();
    const audioElement = document.getElementById('audio');
    audioElement.src = audioUrl;

    // Hide the audio loading indicator once the audio is ready
    audioElement.addEventListener('canplaythrough', () => {
      document.getElementById('audio-loading').classList.remove('show');
    });

    audioElement.play();
  } catch (error) {
    console.error('Error:', error);
  }
}

function handleCharacterNameInput(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default Enter key behavior

    const input = document.getElementById('character-names');
    const inputValue = input.value.trim();

    if (inputValue) {
      // Create a new tag element
      const tag = document.createElement('div');
      tag.className = 'character-name-tag random-bg';
      tag.textContent = inputValue;

      // Append the new tag to the tags container
      const tagsContainer = document.getElementById('character-names-tags');
      tagsContainer.appendChild(tag);

      // Clear the input field
      input.value = '';
    }
  }
}

function handleCharacterDescriptionInput(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default Enter key behavior

    const input = document.getElementById('character-descriptions');
    const inputValue = input.value.trim();

    if (inputValue) {
      // Create a new tag element for character descriptions
      const tag = document.createElement('div');
      tag.className = 'character-description-tag';
      tag.textContent = inputValue;

      // Append the new tag to the descriptions container
      const descriptionsContainer = document.getElementById('character-descriptions-tags');
      descriptionsContainer.appendChild(tag);

      // Clear the textarea field
      input.value = '';
    }
  }
}