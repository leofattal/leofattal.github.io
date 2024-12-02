
const apiKey = "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";

import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const client = new HfInference(apiKey); // Replace with your actual Hugging Face API key
const chatContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const imageUpload = document.createElement("input"); // Hidden input for file selection
imageUpload.type = "file";
imageUpload.accept = "image/*";
const uploadButton = document.getElementById("uploadButton");

const conversationHistory = [
  { role: "assistant", content: "How can I be of help?" }
];

// Get the full URL
const urlParams = new URLSearchParams(window.location.search);

const TTS = urlParams.get('TTS') ? urlParams.get('TTS') : false; // Set to true to enable text-to-speech

// Display initial message
addMessage(conversationHistory[0].content, "agent");

// Event listener for user text input (URLs, commands, or text questions)
userInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && userInput.value.trim()) {
    const userMessage = userInput.value.trim();

    // Check if the user wants to generate an image with /imagine command
    if (userMessage.startsWith("/imagine")) {
      const prompt = userMessage.slice(8).trim(); // Extract the prompt text after "/imagine"
      if (prompt) {
        await generateImageFromPrompt(prompt);
      } else {
        addMessage("Please provide a prompt after /imagine", "agent");
      }
      userInput.value = "";
      return;
    }

    // Add user message to conversation history and display it
    conversationHistory.push({ role: "user", content: userMessage });
    addMessage(userMessage, "user");
    userInput.value = "";

    // Check if the input is a URL
    const urlPattern = /(https?:\/\/[^\s]+)/;
    if (urlPattern.test(userMessage)) {
      const isImageAnalyzed = await analyzeImageURL(userMessage);
      if (isImageAnalyzed) return; // If image analysis was successful, return
    }

    // Otherwise, handle it as text
    const agentMessageId = addMessage("", "agent");
    let out = "";
    const stream = client.chatCompletionStream({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: conversationHistory,
      max_tokens: 1000
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        out += newContent;
        updateMessageContent(agentMessageId, formatResponse(out));

        if (TTS) {
          // Call Bark when text response is complete
          if (chunk.choices[0].finish_reason === "stop") {
            await readTextWithBark(out);
          }
        }
      }
    }

    conversationHistory.push({ role: "assistant", content: out });
  }
});

// Event listener for the `+` button to select an image
uploadButton.addEventListener("click", () => {
  imageUpload.click(); // Trigger file selection dialog
});

// Event listener for handling image file selection and uploading to ImgBB
imageUpload.addEventListener("change", async () => {
  const file = imageUpload.files[0];
  if (file) {
    const imgbbApiKey = "e87d31902b8f721ea869e4f64d158816"; // Replace with your ImgBB API key
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (data && data.data && data.data.url) {
        // Insert the image URL into the chat box and trigger analysis
        userInput.value = data.data.url;
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        userInput.dispatchEvent(event); // Programmatically trigger Enter key to analyze
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("An error occurred while uploading the image.");
    }
  }
  imageUpload.value = ""; // Clear file input after use
});

// Function to generate image from prompt using Flux-Schnell model
async function generateImageFromPrompt(prompt) {
  // Add the user's prompt to the conversation history
  conversationHistory.push({ role: "user", content: `/imagine ${prompt}` });

  // Display loading message
  const loadingMessage = addMessage("Generating image...", "agent");

  try {
    const endpoint = `https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, // Replace with your Hugging Face API key
        'Content-Type': 'application/json',
        "x-use-cache": "false"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { seed: Math.floor(Math.random() * 1000000) }
      })
    });

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    // Remove loading message
    updateMessageContent(loadingMessage, "");

    // Display the generated image
    const imageElement = document.createElement("img");
    imageElement.src = imageUrl;
    imageElement.alt = "Generated image";
    imageElement.style.maxWidth = "100%";
    imageElement.style.borderRadius = "8px";

    const imageMessage = document.createElement("div");
    imageMessage.classList.add("message", "agent");
    imageMessage.appendChild(imageElement);
    chatContainer.appendChild(imageMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (error) {
    updateMessageContent(loadingMessage, "Failed to generate image. Please try again.");
  }
}

// Analyze external image URL
async function analyzeImageURL(imageUrl) {

  // Display the image in the chat immediately
  const imageElement = document.createElement("img");
  imageElement.src = imageUrl;
  imageElement.alt = "User-provided image";
  imageElement.style.maxWidth = "100%";
  imageElement.style.borderRadius = "8px";

  const imageMessage = document.createElement("div");
  imageMessage.classList.add("message", "agent");
  imageMessage.appendChild(imageElement);
  chatContainer.appendChild(imageMessage);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const agentMessageId = addMessage("", "agent");

  try {
    let out = "";
    const stream = client.chatCompletionStream({
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: "Describe this image in one sentence." }
          ]
        }
      ],
      max_tokens: 500
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        out += newContent;
        updateMessageContent(agentMessageId, out);

      }
    }

    conversationHistory.push({ role: "assistant", content: out });
    return true;
  } catch (error) {
    updateMessageContent(agentMessageId, "It looks like this link is not an image, or something went wrong. Please try a different link.");
    conversationHistory.push({ role: "assistant", content: "It looks like this link is not an image, or something went wrong. Please try a different link." });
    return false;
  }
}

function addMessage(content, role) {
  const message = document.createElement("div");
  message.classList.add("message", role);
  message.innerHTML = content;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return message;
}

function updateMessageContent(messageElement, content) {
  if (content === "") {
    // If content is empty, remove the element from the DOM
    messageElement.remove();
  } else {
    // Check if the content contains code markers (like ```) and format it as code
    if (content.includes("```")) {
      // Wrap code content in <pre><code> for code display and remove backticks
      const formattedContent = content
        .replace(/```(.*?)```/gs, (match, code) => `<pre><code>${escapeHTML(code.trim())}</code></pre>`)
        .replace(/```/g, ''); // Remove any remaining ``` markers

      messageElement.innerHTML = formattedContent;
      messageElement.style.fontFamily = "monospace";
    } else {
      // Otherwise, display normally
      messageElement.innerHTML = content;
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function splitTextIntoChunks(text, maxLength = 500) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]; // Split by sentences
  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// async function readTextWithBark(text) {
//   const chunks = splitTextIntoChunks(text);

//   const audioPromises = chunks.map(async (chunk) => {
//     const response = await fetch("https://api-inference.huggingface.co/models/suno/bark", {
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         "Content-Type": "application/json",
//         "x-use-cache": "true",
//       },
//       method: "POST",
//       body: JSON.stringify({ inputs: chunk, paramaters: { voice_preset : "v2/en_speaker_0"} }),
//     });
//     return await response.blob();
//   });

//   const audioBlobs = await Promise.all(audioPromises);

//   // Play each audio sequentially
//   for (const blob of audioBlobs) {
//     const audioUrl = URL.createObjectURL(blob);
//     const audioPlayer = document.getElementById("audioPlayer");
//     audioPlayer.src = audioUrl;
//     await audioPlayer.play();
//   }
// }

async function readTextWithBark(text) {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/suno/bark", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-use-cache": "true" // Enable caching for speed
      },
      method: "POST",
      body: JSON.stringify({ inputs: text, paramaters: { voice_preset: "v2/en_speaker_1" } }),
    });

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play the audio
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block"; // Make audio element visible if needed
    audioPlayer.play();
  } catch (error) {
    console.error("Error generating audio with Bark:", error);
  }
}

// Helper function to escape HTML characters in code snippets
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatResponse(content) {
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^-\s(.*)/gm, "<li>$1</li>")
    .replace(/(?:\r\n|\r|\n)/g, "<br>");

  if (formatted.includes("<li>")) {
    formatted = "<ul>" + formatted + "</ul>";
  }

  return formatted;
}