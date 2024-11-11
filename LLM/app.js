
const apiKey = "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";

import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const client = new HfInference(apiKey);

const chatContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");

const conversationHistory = [
  { role: "assistant", content: "How can I be of help?" }
];

// Display initial message
addMessage(conversationHistory[0].content, "agent");

userInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && userInput.value.trim()) {
    const userMessage = userInput.value.trim();

    // Add user message to conversation history and display it
    conversationHistory.push({ role: "user", content: userMessage });
    addMessage(userMessage, "user");
    userInput.value = "";

    // Check if the input is a URL (simple URL pattern match)
    const urlPattern = /(https?:\/\/[^\s]+)/;
    if (urlPattern.test(userMessage)) {
      const isImage = await analyzeImageURL(userMessage);
      if (isImage) return;
    }

    // Regular text input handling
    const agentMessageId = addMessage("", "agent");
    let out = "";
    const stream = client.chatCompletionStream({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: conversationHistory,
      max_tokens: 500
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        out += newContent;
        updateMessageContent(agentMessageId, formatResponse(out));
      }
    }

    conversationHistory.push({ role: "assistant", content: out });
  }
});

async function analyzeImageURL(imageUrl) {

  // Add the image element to the chat immediately
  const imageElement = document.createElement("img");
  imageElement.src = imageUrl;
  imageElement.alt = "User-provided image";
  imageElement.style.maxWidth = "100%";
  imageElement.style.borderRadius = "8px";

  // Append the image element directly to the chat container above the description
  const imageMessage = document.createElement("div");
  imageMessage.classList.add("message", "agent");
  imageMessage.appendChild(imageElement);
  chatContainer.appendChild(imageMessage);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Create a new message bubble for the image and description
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

    // Add image description to conversation history
    conversationHistory.push({ role: "assistant", content: out });
    return true;  // Indicates image analysis was performed
  } catch (error) {
    // If URL isn't an image, respond with a friendly message
    updateMessageContent(agentMessageId, "It looks like this link is not an image, or something went wrong. Please try a different link.");
    conversationHistory.push({ role: "assistant", content: "It looks like this link is not an image, or something went wrong. Please try a different link." });
    return false;  // Indicates image analysis was not performed
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
  messageElement.innerHTML = content;
  chatContainer.scrollTop = chatContainer.scrollHeight;
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