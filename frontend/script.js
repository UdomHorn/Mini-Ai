const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const textarea = document.getElementById("prompt-input");
const submitButton = document.getElementById("submit-button");
const clearChatButton = document.getElementById("clear-chat");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const emptyStateTemplate = document.getElementById("empty-state-template");
const lightThemeLink = document.getElementById("hljs-light-theme");
const darkThemeLink = document.getElementById("hljs-dark-theme");

const messages = [];
const STORAGE_KEY = "mini-ai-assistant-theme";
let isLoading = false;

marked.setOptions({
  breaks: true,
  gfm: true
});

const highlightCode = typeof window.hljs?.highlightElement === "function"
  ? (block) => window.hljs.highlightElement(block)
  : () => {};

function setLoadingState(loading) {
  isLoading = loading;
  textarea.disabled = loading;
  submitButton.disabled = loading;
  submitButton.textContent = loading ? "Thinking..." : "Send";
}

function autoResizeTextarea() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
}

function updateTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
  lightThemeLink.disabled = isDark;
  darkThemeLink.disabled = !isDark;
  localStorage.setItem(STORAGE_KEY, theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  updateTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function scrollLatestAssistantToTop() {
  const assistantMessages = chatContainer.querySelectorAll(".message-row.assistant");
  const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];

  if (!latestAssistantMessage) {
    scrollToBottom();
    return;
  }

  const topOffset = latestAssistantMessage.offsetTop - 12;
  chatContainer.scrollTop = Math.max(topOffset, 0);
}

function attachCopyBehavior(button, text) {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied!";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("copied");
      }, 1600);
    } catch (error) {
      button.textContent = "Copy failed";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    }
  });
}

function createMessageElement(message) {
  const row = document.createElement("article");
  row.className = `message-row ${message.role}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${message.role}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const role = document.createElement("span");
  role.className = "message-role";
  role.textContent = message.role === "user" ? "You" : "Mini-Ai-Assistant";
  meta.appendChild(role);

  if (message.role === "assistant" && !message.pending) {
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy";
    attachCopyBehavior(copyButton, message.content);
    meta.appendChild(copyButton);
  }

  const content = document.createElement("div");
  content.className = "message-content";

  if (message.role === "assistant") {
    content.innerHTML = marked.parse(message.content);
    content.querySelectorAll("pre code").forEach((block) => {
      highlightCode(block);
    });
  } else {
    content.innerHTML = `<p>${escapeHtml(message.content).replaceAll("\n", "<br />")}</p>`;
  }

  bubble.append(meta, content);
  row.appendChild(bubble);
  return row;
}

function renderMessages(scrollMode = "bottom") {
  chatContainer.innerHTML = "";

  if (!messages.length) {
    chatContainer.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const stack = document.createElement("div");
  stack.className = "chat-stack";

  messages.forEach((message) => {
    stack.appendChild(createMessageElement(message));
  });

  chatContainer.appendChild(stack);

  if (scrollMode === "assistant-top") {
    scrollLatestAssistantToTop();
    return;
  }

  scrollToBottom();
}

async function sendPrompt(prompt) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "The server could not generate a response.");
  }

  return payload.response;
}

async function handleSubmit(event) {
  event.preventDefault();

  if (isLoading) {
    return;
  }

  const prompt = textarea.value.trim();

  if (!prompt) {
    return;
  }

  messages.push({ role: "user", content: prompt });
  messages.push({ role: "assistant", content: "Thinking...", pending: true });
  renderMessages("bottom");
  setLoadingState(true);
  textarea.value = "";
  autoResizeTextarea();

  try {
    const reply = await sendPrompt(prompt);
    messages[messages.length - 1] = { role: "assistant", content: reply };
  } catch (error) {
    messages[messages.length - 1] = {
      role: "assistant",
      content: `### Error\n\n${error.message}`
    };
  } finally {
    setLoadingState(false);
    renderMessages("assistant-top");
    textarea.focus();
  }
}

chatForm.addEventListener("submit", handleSubmit);

textarea.addEventListener("input", autoResizeTextarea);
textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

clearChatButton.addEventListener("click", () => {
  messages.length = 0;
  renderMessages();
  textarea.focus();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  updateTheme(nextTheme);
});

initializeTheme();
autoResizeTextarea();
renderMessages();
