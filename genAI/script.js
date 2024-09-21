document.getElementById('prompt-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = document.getElementById('prompt').value;
    const negativePrompt = document.getElementById('negative-prompt').value;
    const statusMessage = document.getElementById('status-message');
    const imageContainer = document.getElementById('image-container');
    const generatedImage = document.getElementById('generated-image');

    statusMessage.textContent = 'Generating image...';

    try {
        // Fetch the generated image URL from the Hugging Face API
        const imageUrl = await fetchImage(prompt, negativePrompt);

        // Display the image
        generatedImage.src = imageUrl;
        imageContainer.style.display = 'block';
        statusMessage.textContent = 'Image generated!';
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
        console.error('Error generating image:', error);
    }
});

// Function to fetch the generated image from the Hugging Face API
async function fetchImage(prompt, negativePrompt) {
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer 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`,  // Your provided API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: prompt,
            negative_prompt: negativePrompt,  // Optional negative prompt to avoid certain elements
            options: { seed: Math.floor(Math.random() * 1000000) }  // Random seed for varied results
        })
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    const blob = await response.blob();  // Convert the response to a blob
    return URL.createObjectURL(blob);  // Create an object URL for the image
}



