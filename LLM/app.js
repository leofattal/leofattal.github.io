
const apiKey = "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"; 

import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const client = new HfInference(apiKey);

const chatContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");

// Initial agent message
addMessage("How can I be of help?", "agent");

userInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && userInput.value.trim()) {
    const userMessage = userInput.value.trim();
    addMessage(userMessage, "user");
    userInput.value = "";

    // Add an empty message bubble for the assistant response
    const agentMessageId = addMessage("", "agent");

    // Call Hugging Face API
    let out = "";
    const stream = client.chatCompletionStream({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        { role: "user", content: userMessage }
      ],
      max_tokens: 500
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        out += newContent;
        updateMessageContent(agentMessageId, out);  // Update the message in real-time
      }
    }
  }
});

function addMessage(content, role) {
  const message = document.createElement("div");
  message.classList.add("message", role);
  message.textContent = content;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return message; // Return the message element to update it later
}

function updateMessageContent(messageElement, content) {
  messageElement.textContent = content;
  chatContainer.scrollTop = chatContainer.scrollHeight;
}