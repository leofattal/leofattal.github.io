
const apiKey = "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"; 

import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const client = new HfInference(apiKey);

const chatContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");

// Initialize conversation history with the agent's initial message
const conversationHistory = [
  { role: "assistant", content: "How can I help?" }
];

// Display initial message
addMessage(conversationHistory[0].content, "agent");

userInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && userInput.value.trim()) {
    const userMessage = userInput.value.trim();
    
    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: userMessage });
    addMessage(userMessage, "user");
    userInput.value = "";

    // Add an empty message bubble for the assistant response
    const agentMessageId = addMessage("", "agent");

    // Call Hugging Face API with the full conversation history
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
        updateMessageContent(agentMessageId, formatResponse(out));  // Apply formatting
      }
    }

    // After receiving the full response, add it to the conversation history
    conversationHistory.push({ role: "assistant", content: out });
  }
});

function addMessage(content, role) {
  const message = document.createElement("div");
  message.classList.add("message", role);
  message.innerHTML = content; // Use innerHTML to allow formatted content
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return message; // Return the message element to update it later
}

function updateMessageContent(messageElement, content) {
  messageElement.innerHTML = content; // Update as HTML for formatting
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatResponse(content) {
  // Convert Markdown-style syntax to HTML:
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")  // Bold: **text**
    .replace(/\*(.*?)\*/g, "<em>$1</em>")              // Italic: *text*
    .replace(/^-\s(.*)/gm, "<li>$1</li>")              // List item: - text
    .replace(/(?:\r\n|\r|\n)/g, "<br>");               // Line breaks
  
  // Wrap lists in <ul> tags if any <li> elements exist
  if (formatted.includes("<li>")) {
    formatted = "<ul>" + formatted + "</ul>";
  }
  
  return formatted;
}