const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const textarea = document.getElementById("prompt-input");
const submitButton = document.getElementById("submit-button");
const clearChatButton = document.getElementById("clear-chat");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const chatTitle = document.getElementById("chat-title");
const emptyStateTemplate = document.getElementById("empty-state-template");
const lightThemeLink = document.getElementById("hljs-light-theme");
const darkThemeLink = document.getElementById("hljs-dark-theme");
const quickActions = document.querySelector(".quick-actions");
const quickActionsToggle = document.getElementById("quick-actions-toggle");
const quickActionsMenu = document.getElementById("quick-actions-menu");
const languagePickerOverlay = document.getElementById("language-picker-overlay");
const closeLanguagePickerButton = document.getElementById("close-language-picker");
const languagePickerGrid = document.getElementById("language-picker-grid");
const conversionPickerOverlay = document.getElementById("conversion-picker-overlay");
const backConversionPickerButton = document.getElementById("back-conversion-picker");
const closeConversionPickerButton = document.getElementById("close-conversion-picker");
const conversionPickerGrid = document.getElementById("conversion-picker-grid");
const conversionPickerCopy = document.getElementById("conversion-picker-copy");
const historyToggleButton = document.getElementById("history-toggle");
const historyCount = document.getElementById("history-count");
const historyOverlay = document.getElementById("history-overlay");
const closeHistoryButton = document.getElementById("close-history");
const historyList = document.getElementById("history-list");

const messages = [];
const STORAGE_KEY = "mini-ai-assistant-theme";
const HISTORY_STORAGE_KEY = "mini-ai-assistant-user-history";
const QUICK_ACTION_TALK = "Mini AI Assistant";
const QUICK_ACTION_EXPLAIN = "Explain Code";
const QUICK_ACTION_OPTIMIZE = "Optimize Code";
const QUICK_ACTION_REFACTOR = "Refactor Code";
const QUICK_ACTION_CONVERT = "Convert Language";
const QUICK_ACTION_GENERATOR = "Code Generator";
const CODE_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c#",
  "c++",
  "c",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "dart",
  "sql",
  "html",
  "css",
  "bash",
  "shell"
];
const CONVERSION_TARGETS = {
  javascript: ["typescript", "python", "java", "c#", "c++", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  typescript: ["javascript", "python", "java", "c#", "c++", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  python: ["javascript", "typescript", "java", "c#", "c++", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  java: ["javascript", "typescript", "python", "c#", "c++", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  "c#": ["javascript", "typescript", "python", "java", "c++", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  "c++": ["javascript", "typescript", "python", "java", "c#", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  c: ["javascript", "typescript", "python", "java", "c#", "c++", "go", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  go: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "rust", "php", "ruby", "swift", "kotlin", "dart"],
  rust: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "php", "ruby", "swift", "kotlin", "dart"],
  php: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "rust", "ruby"],
  ruby: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "rust", "php"],
  swift: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "rust", "kotlin", "dart"],
  kotlin: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "rust", "swift", "dart"],
  dart: ["javascript", "typescript", "python", "java", "c#", "c++", "c", "go", "rust", "swift", "kotlin"],
  bash: ["shell", "python", "javascript"],
  shell: ["bash", "python", "javascript"]
};
let isLoading = false;
let activeQuickAction = QUICK_ACTION_TALK;
let lastChatScrollTop = 0;
let pendingGeneratorPrompt = "";
let selectedGeneratorLanguage = "";
let conversionSourceLanguage = "";
let conversionTargetLanguage = "";
let conversationHistory = [];
let expandedHistoryId = "";

marked.setOptions({
  breaks: true,
  gfm: true
});

const highlightCode = typeof window.hljs?.highlightElement === "function"
  ? (block) => window.hljs.highlightElement(block)
  : () => {};

function isSmallScreen() {
  return window.matchMedia("(max-width: 720px)").matches;
}

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
    const defaultLabel = button.dataset.label || "Copy";
    const copiedLabel = button.dataset.copiedLabel || "Copied!";
    const failedLabel = button.dataset.failedLabel || "Copy failed";

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = copiedLabel;
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = defaultLabel;
        button.classList.remove("copied");
      }, 1600);
    } catch (error) {
      button.textContent = failedLabel;
      window.setTimeout(() => {
        button.textContent = defaultLabel;
      }, 1600);
    }
  });
}

function enhanceCodeBlocks(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");

    if (!code) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    const toolbar = document.createElement("div");
    toolbar.className = "code-block-toolbar";

    const languageLabel = document.createElement("span");
    languageLabel.className = "code-block-language";

    const languageClass = [...code.classList].find((name) => name.startsWith("language-"));
    languageLabel.textContent = languageClass ? languageClass.replace("language-", "") : "code";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-button code-copy-button";
    copyButton.textContent = "Copy code";
    copyButton.dataset.label = "Copy code";
    copyButton.dataset.copiedLabel = "Copied!";
    copyButton.dataset.failedLabel = "Copy failed";
    attachCopyBehavior(copyButton, code.textContent || "");

    toolbar.append(languageLabel, copyButton);
    pre.replaceWith(wrapper);
    wrapper.append(toolbar, pre);
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
  role.textContent = message.role === "user" ? "You" : "Mini AI Assistant";
  meta.appendChild(role);

  if (message.role === "assistant" && !message.pending) {
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy reply";
    copyButton.dataset.label = "Copy reply";
    copyButton.dataset.copiedLabel = "Copied!";
    copyButton.dataset.failedLabel = "Copy failed";
    attachCopyBehavior(copyButton, message.content);
    meta.appendChild(copyButton);
  }

  const content = document.createElement("div");
  content.className = "message-content";

  if (message.role === "assistant") {
    content.innerHTML = marked.parse(message.content);
    enhanceCodeBlocks(content);
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

function getEmptyStateGuidance(actionLabel) {
  if (actionLabel === QUICK_ACTION_EXPLAIN) {
    return {
      mode: "Explain Code",
      copy: "Paste a code snippet and Mini AI Assistant will break down what each part does, how the flow works, and what needs to be fixed if the code has mistakes."
    };
  }

  if (actionLabel === QUICK_ACTION_OPTIMIZE) {
    return {
      mode: "Optimize Code",
      copy: "Paste working code when you want faster logic, cleaner performance, or less repeated work. This mode focuses on efficiency while trying to keep the same behavior."
    };
  }

  if (actionLabel === QUICK_ACTION_REFACTOR) {
    return {
      mode: "Refactor Code",
      copy: "Paste code that works but feels messy. This mode improves structure, naming, readability, and maintainability so the code is easier to extend later."
    };
  }

  if (actionLabel === QUICK_ACTION_CONVERT) {
    return {
      mode: "Convert Language",
      copy: "Choose a valid source language and target language, then paste your code. Mini AI Assistant will rewrite the logic in the target language while preserving the original behavior as closely as possible."
    };
  }

  if (actionLabel === QUICK_ACTION_GENERATOR) {
    return {
      mode: "Code Generator",
      copy: "Describe what you want to build, the key features, and any requirements. If you do not name a language, Mini AI Assistant will ask you to choose one before generating code."
    };
  }

  return {
    mode: "Mini AI Assistant",
    copy: "Ask for coding help, project ideas, debugging steps, next actions, or technical explanations. Use this mode when you want flexible guidance instead of a strict code-only workflow."
  };
}

function renderMessages(scrollMode = "bottom") {
  chatContainer.innerHTML = "";

  if (!messages.length) {
    const emptyStateFragment = emptyStateTemplate.content.cloneNode(true);
    const guidance = getEmptyStateGuidance(activeQuickAction);
    const modeElement = emptyStateFragment.getElementById("empty-state-mode");
    const copyElement = emptyStateFragment.getElementById("empty-state-copy");

    if (modeElement) {
      modeElement.textContent = guidance.mode;
    }

    if (copyElement) {
      copyElement.textContent = guidance.copy;
    }

    chatContainer.appendChild(emptyStateFragment);
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

function toggleQuickActions(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : quickActionsMenu.classList.contains("hidden");

  quickActionsMenu.classList.toggle("hidden", !shouldOpen);
  quickActionsToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function openHistoryPanel() {
  renderHistoryList();
  historyOverlay.classList.remove("hidden");
  historyOverlay.setAttribute("aria-hidden", "false");
}

function closeHistoryPanel() {
  historyOverlay.classList.add("hidden");
  historyOverlay.setAttribute("aria-hidden", "true");
}

function openLanguagePicker() {
  languagePickerOverlay.classList.remove("hidden");
  languagePickerOverlay.setAttribute("aria-hidden", "false");
}

function openConversionPicker() {
  renderConversionPicker();
  conversionPickerOverlay.classList.remove("hidden");
  conversionPickerOverlay.setAttribute("aria-hidden", "false");
}

function loadPromptHistory() {
  try {
    const savedHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    conversationHistory = Array.isArray(savedHistory) ? savedHistory : [];
  } catch (error) {
    conversationHistory = [];
  }

  updateHistoryCount();
}

function savePromptHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversationHistory));
}

function updateHistoryCount() {
  historyCount.textContent = String(conversationHistory.length);
}

function addConversationToHistory(question, answer) {
  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();

  if (!trimmedQuestion || !trimmedAnswer) {
    return;
  }

  conversationHistory = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      question: trimmedQuestion,
      answer: trimmedAnswer,
      mode: activeQuickAction,
      savedAt: new Date().toLocaleString()
    },
    ...conversationHistory
  ].slice(0, 30);

  expandedHistoryId = conversationHistory[0]?.id || "";
  savePromptHistory();
  updateHistoryCount();
}

function createHistorySummary(entry) {
  const question = (entry.question || "").replace(/\s+/g, " ").trim();
  const answer = (entry.answer || "")
    .replace(/[#`>*_\-\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const mode = entry.mode || QUICK_ACTION_TALK;

  function shortenTopic(text) {
    const compact = text
      .replace(/^(please|can you|could you|help me|i want to|how to)\s+/i, "")
      .trim();

    return compact.length > 28 ? `${compact.slice(0, 28).trim()}...` : compact;
  }

  if (mode === QUICK_ACTION_EXPLAIN && question) {
    return `Explain: ${shortenTopic(question)}`;
  }

  if (mode === QUICK_ACTION_OPTIMIZE && question) {
    return `Optimize: ${shortenTopic(question)}`;
  }

  if (mode === QUICK_ACTION_REFACTOR && question) {
    return `Refactor: ${shortenTopic(question)}`;
  }

  if (mode === QUICK_ACTION_CONVERT && question) {
    return `Convert: ${shortenTopic(question)}`;
  }

  if (mode === QUICK_ACTION_GENERATOR && question) {
    return `Generate: ${shortenTopic(question)}`;
  }

  if (question) {
    return `Chat: ${shortenTopic(question)}`;
  }

  if (answer) {
    return shortenTopic(answer);
  }

  return "Conversation";
}

function renderHistoryList() {
  historyList.innerHTML = "";

  if (!conversationHistory.length) {
    const emptyItem = document.createElement("div");
    emptyItem.className = "history-item";
    emptyItem.innerHTML = `
      <p class="history-item-meta">No History Yet</p>
      <p class="history-item-text">Your questions and AI answers will appear here after you chat.</p>
    `;
    historyList.appendChild(emptyItem);
    return;
  }

  conversationHistory.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const isExpanded = entry.id === expandedHistoryId;
    item.innerHTML = `
      <button class="history-item-toggle" type="button" data-history-id="${escapeHtml(entry.id)}" aria-expanded="${isExpanded ? "true" : "false"}">
        <span class="history-item-title">${escapeHtml(createHistorySummary(entry))}</span>
        <span class="history-item-chevron" aria-hidden="true">${isExpanded ? "−" : "+"}</span>
      </button>
      <div class="history-item-detail${isExpanded ? "" : " hidden"}">
        <p class="history-section-label">User Question</p>
        <p class="history-item-text">${escapeHtml(entry.question || "")}</p>
        <p class="history-section-label">AI Answer</p>
        <div class="history-answer">${marked.parse(entry.answer || "")}</div>
      </div>
    `;

    const detail = item.querySelector(".history-item-detail");
    enhanceCodeBlocks(detail);
    detail.querySelectorAll("pre code").forEach((block) => {
      highlightCode(block);
    });

    historyList.appendChild(item);
  });
}

function closeLanguagePicker() {
  languagePickerOverlay.classList.add("hidden");
  languagePickerOverlay.setAttribute("aria-hidden", "true");
}

function closeConversionPicker() {
  conversionPickerOverlay.classList.add("hidden");
  conversionPickerOverlay.setAttribute("aria-hidden", "true");
}

function populateLanguagePicker() {
  CODE_LANGUAGES.forEach((language) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-choice-button";
    button.dataset.language = language;
    button.textContent = language.toUpperCase();
    languagePickerGrid.appendChild(button);
  });
}

function getConvertibleSourceLanguages() {
  return Object.keys(CONVERSION_TARGETS).filter((language) => CONVERSION_TARGETS[language]?.length);
}

function getConvertibleTargetLanguages(sourceLanguage) {
  return CONVERSION_TARGETS[sourceLanguage] || [];
}

function renderConversionPicker() {
  conversionPickerGrid.innerHTML = "";

  const isPickingTarget = Boolean(conversionSourceLanguage);
  const languagesToRender = isPickingTarget
    ? getConvertibleTargetLanguages(conversionSourceLanguage)
    : getConvertibleSourceLanguages();
  backConversionPickerButton.classList.toggle("hidden", !isPickingTarget);
  conversionPickerCopy.textContent = isPickingTarget
    ? `Source: ${conversionSourceLanguage.toUpperCase()}. Now choose the target language.`
    : "Choose the source language first, then the target language.";

  languagesToRender.forEach((language) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-choice-button";
    button.dataset.language = language;
    button.textContent = language.toUpperCase();
    conversionPickerGrid.appendChild(button);
  });
}

function getQuickActionTitle(actionLabel) {
  return "Mini AI Assistant";
}

function getModeSwitchMessage(actionLabel) {
  if (actionLabel === QUICK_ACTION_EXPLAIN) {
    return "You are now in `Explain Code` mode.";
  }

  if (actionLabel === QUICK_ACTION_OPTIMIZE) {
    return "You are now in `Optimize Code` mode.";
  }

  if (actionLabel === QUICK_ACTION_REFACTOR) {
    return "You are now in `Refactor Code` mode.";
  }

  if (actionLabel === QUICK_ACTION_CONVERT) {
    return "You are now in `Convert Language` mode.";
  }

  if (actionLabel === QUICK_ACTION_GENERATOR) {
    return "You are now in `Code Generator` mode.";
  }

  return "You are now in `Mini AI Assistant` mode.";
}

function getQuickActionPlaceholder(actionLabel) {
  if (isSmallScreen()) {
    return actionLabel === QUICK_ACTION_TALK
      ? "Ask any thing..."
      : "Past your code here...";
  }

  if (actionLabel === QUICK_ACTION_EXPLAIN) {
    return "Paste your code here. Mini AI Assistant will explain it and correct clear mistakes if needed.";
  }

  if (actionLabel === QUICK_ACTION_OPTIMIZE) {
    return "Paste your code here. Mini AI Assistant will improve performance, efficiency, and code quality.";
  }

  if (actionLabel === QUICK_ACTION_REFACTOR) {
    return "Paste your code here. Mini AI Assistant will improve structure, readability, and maintainability.";
  }

  if (actionLabel === QUICK_ACTION_CONVERT) {
    return conversionSourceLanguage && conversionTargetLanguage
      ? `Paste your ${conversionSourceLanguage.toUpperCase()} code here. Mini AI Assistant will convert it to ${conversionTargetLanguage.toUpperCase()}.`
      : "Choose a valid source and target language first, then paste the code you want to convert.";
  }

  if (actionLabel === QUICK_ACTION_GENERATOR) {
    return "Describe what you want to build, key features, and requirements. If you do not include a language, you will be asked to choose one.";
  }

  return "Ask about your idea, bug, feature, code problem, or next step.";
}

function looksLikeCode(value) {
  const codeSignals = [
    "{",
    "}",
    ";",
    "()",
    "=>",
    "</",
    "def ",
    "function ",
    "const ",
    "let ",
    "class ",
    "import ",
    "export ",
    "return ",
    "if (",
    "for (",
    "while (",
    "public ",
    "private ",
    "#include",
    "SELECT ",
    "INSERT ",
    "console.",
    "print(",
    "fmt."
  ];

  const normalized = value.trim();

  return normalized.includes("\n")
    || codeSignals.some((signal) => normalized.includes(signal))
    || /^```[\s\S]*```$/m.test(normalized);
}

function isWebsiteRequest(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  const webSignals = [
    "website",
    "web site",
    "webpage",
    "web page",
    "landing page",
    "portfolio site",
    "portfolio website",
    "frontend",
    "front end",
    "html",
    "css",
    "javascript",
    "responsive page",
    "browser app"
  ];

  return webSignals.some((signal) => normalizedPrompt.includes(signal));
}

function createModePrompt(prompt) {
  if (activeQuickAction === QUICK_ACTION_EXPLAIN) {
    return [
      "Explain the following code clearly.",
      "Focus on what each part does, the flow of execution, important patterns, and possible issues.",
      "If the code is wrong, buggy, incomplete, or has syntax mistakes, correct it.",
      "When you correct it, include a fixed code version and clearly explain what was wrong.",
      "Keep the explanation practical and easy to understand.",
      "",
      "Code:",
      "```",
      prompt,
      "```"
    ].join("\n");
  }

  if (activeQuickAction === QUICK_ACTION_OPTIMIZE) {
    return [
      "Optimize the following code.",
      "Focus on performance, unnecessary work, cleaner logic, and safe improvements.",
      "Preserve the original behavior unless a bug must be fixed.",
      "Explain the main optimizations briefly.",
      "Return the optimized code in a single code block.",
      "",
      "Code:",
      "```",
      prompt,
      "```"
    ].join("\n");
  }

  if (activeQuickAction === QUICK_ACTION_REFACTOR) {
    return [
      "Refactor the following code.",
      "Focus on readability, maintainability, naming, structure, and separation of concerns.",
      "Preserve the original behavior unless a bug must be fixed.",
      "Explain the main refactors briefly.",
      "Return the refactored code in a single code block.",
      "",
      "Code:",
      "```",
      prompt,
      "```"
    ].join("\n");
  }

  if (activeQuickAction === QUICK_ACTION_CONVERT) {
    return [
      "Convert the following code to another programming language.",
      `Source language: ${conversionSourceLanguage || "unknown"}.`,
      `Target language: ${conversionTargetLanguage || "unknown"}.`,
      "Preserve the original behavior as closely as possible.",
      "Adjust syntax, standard libraries, and idioms for the target language.",
      "Explain any unavoidable differences briefly.",
      "Return the converted code in a single code block.",
      "",
      "Code:",
      "```",
      prompt,
      "```"
    ].join("\n");
  }

  if (activeQuickAction === QUICK_ACTION_GENERATOR) {
    const requestedLanguage = detectRequestedLanguage(prompt)
      || selectedGeneratorLanguage
      || "the best technology if the user did not specify one";

    return [
      "You are in Code Generator mode.",
      "First analyze the problem carefully.",
      `Use ${requestedLanguage}. If the user did not specify a language, choose the best technology for the problem.`,
      "Write clean, modular, and maintainable code.",
      "Include error handling and validation where appropriate.",
      "Add helpful comments.",
      "Ensure the code can run without modification.",
      "Do not output broken or incomplete code.",
      "Do not use placeholders like '...' or 'TODO'.",
      "Do not assume missing critical data; handle it safely in code.",
      "Keep the response concise but complete.",
      "Output strictly in this format:",
      "Explanation",
      "Code",
      "Notes",
      "The Code section must contain the code in a single code block.",
      "Only include Notes if needed.",
      "",
      `User request: ${prompt}`
    ].join("\n");
  }

  return prompt;
}

function appendAssistantNotice(content) {
  messages.push({ role: "assistant", content });
  renderMessages("assistant-top");
}

function appendModeNotice(title, message) {
  appendAssistantNotice(`### ${title}\n\n${message}`);
}

function detectRequestedLanguage(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  return CODE_LANGUAGES.find((language) => normalizedPrompt.includes(language)) || "";
}

function setActiveQuickAction(activeButton) {
  quickActionsMenu.querySelectorAll(".quick-action-button").forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });

  const actionLabel = activeButton.querySelector("span:last-child")?.textContent?.trim();

  if (actionLabel) {
    activeQuickAction = actionLabel;
    chatTitle.textContent = getQuickActionTitle(actionLabel);
  }

  if (actionLabel !== QUICK_ACTION_GENERATOR) {
    selectedGeneratorLanguage = "";
    pendingGeneratorPrompt = "";
  }

  if (actionLabel !== QUICK_ACTION_CONVERT) {
    conversionSourceLanguage = "";
    conversionTargetLanguage = "";
    closeConversionPicker();
  }

  textarea.placeholder = getQuickActionPlaceholder(actionLabel);

  if (actionLabel === QUICK_ACTION_CONVERT) {
    conversionSourceLanguage = "";
    conversionTargetLanguage = "";
    renderConversionPicker();
    openConversionPicker();
  }

  if (!messages.length) {
    renderMessages();
  }
}

async function submitPrompt(prompt) {
  const finalPrompt = createModePrompt(prompt);

  messages.push({ role: "user", content: prompt });
  messages.push({ role: "assistant", content: "Thinking...", pending: true });
  renderMessages("bottom");
  setLoadingState(true);
  textarea.value = "";
  autoResizeTextarea();

  try {
    const reply = await sendPrompt(finalPrompt);
    messages[messages.length - 1] = { role: "assistant", content: reply };
    addConversationToHistory(prompt, reply);
  } catch (error) {
    const errorReply = `### Error\n\n${error.message}`;
    messages[messages.length - 1] = {
      role: "assistant",
      content: errorReply
    };
    addConversationToHistory(prompt, errorReply);
  } finally {
    setLoadingState(false);
    renderMessages("assistant-top");
    textarea.focus();
  }
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

  if (activeQuickAction === QUICK_ACTION_EXPLAIN && !looksLikeCode(prompt)) {
    appendModeNotice("Paste Code Only", "`Explain Code` mode only works with pasted code. Paste your code snippet first, then send it again.");
    textarea.focus();
    return;
  }

  if (activeQuickAction === QUICK_ACTION_OPTIMIZE && !looksLikeCode(prompt)) {
    appendModeNotice("Paste Code Only", "`Optimize Code` mode only works with pasted code. Paste the code you want optimized, then send it again.");
    textarea.focus();
    return;
  }

  if (activeQuickAction === QUICK_ACTION_REFACTOR && !looksLikeCode(prompt)) {
    appendModeNotice("Paste Code Only", "`Refactor Code` mode only works with pasted code. Paste the code you want refactored, then send it again.");
    textarea.focus();
    return;
  }

  if (activeQuickAction === QUICK_ACTION_CONVERT) {
    const validTargets = getConvertibleTargetLanguages(conversionSourceLanguage);

    if (!conversionSourceLanguage || !conversionTargetLanguage) {
      openConversionPicker();
      appendModeNotice("Choose Conversion", "Pick a valid source and target language first, for example `Python -> JavaScript`, then send your code.");
      textarea.focus();
      return;
    }

    if (!validTargets.includes(conversionTargetLanguage)) {
      conversionTargetLanguage = "";
      openConversionPicker();
      appendModeNotice("Choose Valid Conversion", `\`${conversionSourceLanguage.toUpperCase()}\` cannot be converted to that target here. Choose one of the available target languages.`);
      textarea.focus();
      return;
    }

    if (!looksLikeCode(prompt)) {
      appendModeNotice(
        "Paste Code Only",
        `\`Convert Language\` mode only works with pasted code. Paste your ${conversionSourceLanguage.toUpperCase()} code first, then send it again.`
      );
      textarea.focus();
      return;
    }
  }

  if (activeQuickAction === QUICK_ACTION_GENERATOR) {
    const detectedLanguage = detectRequestedLanguage(prompt);

    if (detectedLanguage) {
      selectedGeneratorLanguage = detectedLanguage;
      await submitPrompt(prompt);
      return;
    }

    pendingGeneratorPrompt = prompt;
    openLanguagePicker();
    return;
  }

  await submitPrompt(prompt);
}

chatForm.addEventListener("submit", handleSubmit);

textarea.addEventListener("input", () => {
  autoResizeTextarea();
});
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

historyToggleButton.addEventListener("click", () => {
  openHistoryPanel();
});

closeHistoryButton.addEventListener("click", () => {
  closeHistoryPanel();
  textarea.focus();
});

historyOverlay.addEventListener("click", (event) => {
  if (event.target === historyOverlay) {
    closeHistoryPanel();
    textarea.focus();
  }
});

historyList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest(".history-item-toggle");

  if (!toggleButton) {
    return;
  }

  const historyId = toggleButton.dataset.historyId || "";
  expandedHistoryId = expandedHistoryId === historyId ? "" : historyId;
  renderHistoryList();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  updateTheme(nextTheme);
});

quickActionsToggle.addEventListener("click", () => {
  toggleQuickActions();
});

quickActionsMenu.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".quick-action-button");

  if (!actionButton) {
    return;
  }

  setActiveQuickAction(actionButton);
  appendAssistantNotice(`### Mode Changed\n\n${getModeSwitchMessage(activeQuickAction)}`);
  textarea.value = "";
  autoResizeTextarea();
  textarea.focus();
  toggleQuickActions(false);
});

closeLanguagePickerButton.addEventListener("click", () => {
  closeLanguagePicker();
  textarea.focus();
});

closeConversionPickerButton.addEventListener("click", () => {
  closeConversionPicker();
  textarea.focus();
});

backConversionPickerButton.addEventListener("click", () => {
  conversionSourceLanguage = "";
  conversionTargetLanguage = "";
  renderConversionPicker();
  textarea.placeholder = getQuickActionPlaceholder(activeQuickAction);
});

languagePickerOverlay.addEventListener("click", (event) => {
  if (event.target === languagePickerOverlay) {
    closeLanguagePicker();
    textarea.focus();
  }
});

conversionPickerOverlay.addEventListener("click", (event) => {
  if (event.target === conversionPickerOverlay) {
    closeConversionPicker();
    textarea.focus();
  }
});

languagePickerGrid.addEventListener("click", async (event) => {
  const languageButton = event.target.closest(".language-choice-button");

  if (!languageButton || !pendingGeneratorPrompt) {
    return;
  }

  selectedGeneratorLanguage = languageButton.dataset.language || "";
  closeLanguagePicker();
  await submitPrompt(pendingGeneratorPrompt);
  pendingGeneratorPrompt = "";
});

conversionPickerGrid.addEventListener("click", (event) => {
  const languageButton = event.target.closest(".language-choice-button");

  if (!languageButton) {
    return;
  }

  const selectedLanguage = languageButton.dataset.language || "";

  if (!conversionSourceLanguage) {
    conversionSourceLanguage = selectedLanguage;
    conversionTargetLanguage = "";
    renderConversionPicker();
    textarea.placeholder = getQuickActionPlaceholder(activeQuickAction);
    return;
  }

  conversionTargetLanguage = selectedLanguage;
  closeConversionPicker();
  textarea.placeholder = getQuickActionPlaceholder(activeQuickAction);
  textarea.focus();
});

window.addEventListener("resize", () => {
  textarea.placeholder = getQuickActionPlaceholder(activeQuickAction);
});

chatContainer.addEventListener("scroll", () => {
  const currentScrollTop = chatContainer.scrollTop;
  const scrollDelta = currentScrollTop - lastChatScrollTop;

  if (scrollDelta > 6) {
    quickActions.classList.add("scroll-hidden");
  } else if (scrollDelta < -6) {
    quickActions.classList.remove("scroll-hidden");
  }

  if (currentScrollTop <= 8) {
    quickActions.classList.remove("scroll-hidden");
  }

  lastChatScrollTop = currentScrollTop;
});

const defaultQuickActionButton = quickActionsMenu.querySelector(".quick-action-button.active");

if (defaultQuickActionButton) {
  setActiveQuickAction(defaultQuickActionButton);
}

populateLanguagePicker();
renderConversionPicker();
loadPromptHistory();
initializeTheme();
autoResizeTextarea();
renderMessages();
