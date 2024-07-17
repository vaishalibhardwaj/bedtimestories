async function createStory() {
    const name = document.getElementById('name').value;
    const favoriteColor = document.getElementById('favoriteColor').value;
    const favoriteAnimal = document.getElementById('favoriteAnimal').value;
    const theme = document.getElementById('theme').value;
  
    const response = await fetch('/api/create-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, favoriteColor, favoriteAnimal, theme })
    });
  
    const data = await response.json();
    document.getElementById('story').innerText = data.story;
  
    // Fetch the generated speech
    const audioResponse = await fetch('/api/get-speech');
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    document.getElementById('audio').src = audioUrl;
  }