document.getElementById('prompt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = document.getElementById('prompt').value;
    const statusMessage = document.getElementById('status-message');
    const imageContainer = document.getElementById('image-container');
    const generatedImage = document.getElementById('generated-image');

    statusMessage.textContent = 'Generating image...';

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer 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`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        generatedImage.src = imageUrl;
        imageContainer.style.display = 'block';
        statusMessage.textContent = 'Image generated!';
    } catch (error) {
        statusMessage.textContent = 'Failed to generate image. Please try again!';
        console.error(error);
    }
});

