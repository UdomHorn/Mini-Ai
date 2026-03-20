import { memo, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "mini-ai-assistant-theme";
const HISTORY_STORAGE_KEY = "mini-ai-assistant-user-history";
const QUICK_ACTION_TALK = "Talk To Mini AI";
const QUICK_ACTION_EXPLAIN = "Explain Code";
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
const QUICK_ACTIONS = [
  { label: QUICK_ACTION_TALK, icon: "Talk" },
  { label: QUICK_ACTION_EXPLAIN, icon: "?" },
  { label: QUICK_ACTION_GENERATOR, icon: "{ }" }
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdown(markedApi, value) {
  if (!markedApi) {
    return `<p>${escapeHtml(value).replaceAll("\n", "<br />")}</p>`;
  }

  const renderer = new markedApi.Renderer();

  renderer.code = ({ text, lang }) => {
    const language = lang || "code";
    const escapedLanguage = escapeHtml(language);

    return `
      <div class="js-code-block my-4 overflow-hidden rounded-[18px] border border-black/10 bg-[var(--code-bg)]">
        <div class="flex items-center justify-between gap-3 border-b border-black/10 bg-black/5 px-3 py-2">
          <span class="text-[0.74rem] uppercase tracking-[0.08em] text-[var(--muted)]">${escapedLanguage}</span>
          <button type="button" class="js-copy-code rounded-full bg-black/8 px-3 py-1.5 text-sm text-[var(--text)] transition hover:-translate-y-px">
            Copy code
          </button>
        </div>
        <pre class="m-0 overflow-x-auto p-4"><code class="language-${escapedLanguage}">${escapeHtml(text)}</code></pre>
      </div>
    `;
  };

  return markedApi.parse(value, { renderer });
}

function createHistorySummary(entry) {
  const question = (entry.question || "").replace(/\s+/g, " ").trim();
  const answer = (entry.answer || "")
    .replace(/[#`>*_\-\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const mode = entry.mode || QUICK_ACTION_TALK;

  const shortenTopic = (text) => {
    const compact = text.replace(/^(please|can you|could you|help me|i want to|how to)\s+/i, "").trim();
    return compact.length > 28 ? `${compact.slice(0, 28).trim()}...` : compact;
  };

  if (mode === QUICK_ACTION_EXPLAIN && question) {
    return `Explain: ${shortenTopic(question)}`;
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

function detectRequestedLanguage(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  return CODE_LANGUAGES.find((language) => normalizedPrompt.includes(language)) || "";
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

  return (
    normalized.includes("\n")
    || codeSignals.some((signal) => normalized.includes(signal))
    || /^```[\s\S]*```$/m.test(normalized)
  );
}

function getQuickActionTitle(actionLabel) {
  if (actionLabel === QUICK_ACTION_EXPLAIN) {
    return "Paste Code To Explain";
  }

  if (actionLabel === QUICK_ACTION_GENERATOR) {
    return "Generate Project Code";
  }

  return "Talk To Mini AI";
}

function getQuickActionPlaceholder(actionLabel) {
  if (actionLabel === QUICK_ACTION_EXPLAIN) {
    return "Paste your code here. Mini AI Assistant will explain it and correct clear mistakes if needed.";
  }

  if (actionLabel === QUICK_ACTION_GENERATOR) {
    return "Describe what you want to build, key features, and requirements. If you do not include a language, you will be asked to choose one.";
  }

  return "Ask about your idea, bug, feature, code problem, or next step.";
}

function createModePrompt(prompt, activeQuickAction, selectedGeneratorLanguage) {
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

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedHistory = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(savedHistory) ? savedHistory : [];
  } catch {
    return [];
  }
}

const MessageCard = memo(function MessageCard({ message, copiedReplyId, markedApi, onCopyReply }) {
  const markup = useMemo(() => {
    if (message.role !== "assistant") {
      return escapeHtml(message.content).replaceAll("\n", "<br />");
    }

    return renderMarkdown(markedApi, message.content);
  }, [markedApi, message.content, message.role]);

  const bubbleClasses = message.role === "user"
    ? "bg-[linear-gradient(135deg,var(--user),#1e40af)] text-[var(--user-text)] rounded-[24px] rounded-br-[8px]"
    : "border border-black/10 bg-[var(--assistant)] rounded-[24px] rounded-bl-[8px]";

  return (
    <article className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`message-enter w-full max-w-[760px] px-4 py-4 leading-7 md:px-[18px] ${bubbleClasses}`}>
        <div className="mb-3 flex items-center justify-between gap-3 text-[0.82rem] uppercase tracking-[0.06em]">
          <span className="text-[var(--muted)]">{message.role === "user" ? "You" : "Mini-Ai-Assistant"}</span>
          {message.role === "assistant" && !message.pending ? (
            <button
              type="button"
              onClick={() => onCopyReply(message)}
              className={`rounded-full px-3 py-1.5 text-sm text-[var(--text)] transition hover:-translate-y-px ${
                copiedReplyId === message.id ? "bg-emerald-500/20" : "bg-black/8"
              }`}
            >
              {copiedReplyId === message.id ? "Copied!" : "Copy reply"}
            </button>
          ) : null}
        </div>
        <div className="markdown-body text-[15px]" dangerouslySetInnerHTML={{ __html: message.role === "assistant" ? markup : `<p>${markup}</p>` }} />
      </div>
    </article>
  );
});

const HistoryItem = memo(function HistoryItem({ entry, expanded, markedApi, onToggle }) {
  const answerMarkup = useMemo(() => renderMarkdown(markedApi, entry.answer || ""), [entry.answer, markedApi]);

  return (
    <article className="overflow-hidden rounded-[20px] border border-[var(--panel-border)] bg-white/60">
      <button
        type="button"
        onClick={() => onToggle(entry.id)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-[18px] py-4 text-left text-[var(--text)]"
      >
        <span className="font-semibold">{createHistorySummary(entry)}</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-black/8">{expanded ? "-" : "+"}</span>
      </button>
      {expanded ? (
        <div className="px-[18px] pb-[18px]">
          <p className="mb-2 mt-3 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">User Question</p>
          <p className="m-0 whitespace-pre-wrap text-[var(--text)]">{entry.question || ""}</p>
          <p className="mb-2 mt-4 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">AI Answer</p>
          <div className="markdown-body text-[var(--text)]" dangerouslySetInnerHTML={{ __html: answerMarkup }} />
        </div>
      ) : null}
    </article>
  );
});

function Modal({ open, titleId, title, eyebrow, copy, onClose, children, panelClassName = "" }) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-slate-950/30 p-5 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`glass-panel w-full rounded-[28px] p-6 ${panelClassName}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={titleId} className="m-0 text-2xl font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/8 px-4 py-2 text-[var(--text)] transition hover:-translate-y-px"
          >
            Close
          </button>
        </div>
        <p className="mt-4 text-[var(--muted)]">{copy}</p>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [history, setHistory] = useState(getInitialHistory);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsHidden, setQuickActionsHidden] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState(QUICK_ACTION_TALK);
  const [pendingGeneratorPrompt, setPendingGeneratorPrompt] = useState("");
  const [selectedGeneratorLanguage, setSelectedGeneratorLanguage] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState("");
  const [copiedReplyId, setCopiedReplyId] = useState("");
  const [markedApi, setMarkedApi] = useState(null);
  const [highlightApi, setHighlightApi] = useState(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const lastScrollTop = useRef(0);
  const pendingScrollMode = useRef("bottom");
  const nextMessageId = useRef(1);

  useEffect(() => {
    let cancelled = false;

    import("marked").then(({ marked }) => {
      if (cancelled) {
        return;
      }

      marked.setOptions({
        breaks: true,
        gfm: true
      });
      setMarkedApi(() => marked);
    });

    import("highlight.js/lib/common").then((module) => {
      if (!cancelled) {
        setHighlightApi(() => module.default || module);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [prompt]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    if (!messages.length) {
      container.scrollTop = 0;
      return;
    }

    if (pendingScrollMode.current === "assistant-top") {
      const assistantMessages = container.querySelectorAll('[data-role="assistant"]');
      const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];

      if (latestAssistantMessage instanceof HTMLElement) {
        container.scrollTop = Math.max(latestAssistantMessage.offsetTop - 12, 0);
      } else {
        container.scrollTop = container.scrollHeight;
      }

      pendingScrollMode.current = "bottom";
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    if (!highlightApi) {
      return;
    }

    container.querySelectorAll("pre code").forEach((block) => {
      highlightApi.highlightElement(block);
    });
  }, [expandedHistoryId, highlightApi, historyOpen, messages, theme]);

  const title = getQuickActionTitle(activeQuickAction);
  const placeholder = getQuickActionPlaceholder(activeQuickAction);

  function getMessageId() {
    const id = nextMessageId.current;
    nextMessageId.current += 1;
    return `message-${id}`;
  }

  function addConversationToHistory(question, answer) {
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (!trimmedQuestion || !trimmedAnswer) {
      return;
    }

    setHistory((currentHistory) => {
      const nextHistory = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          mode: activeQuickAction,
          savedAt: new Date().toLocaleString()
        },
        ...currentHistory
      ].slice(0, 30);

      setExpandedHistoryId(nextHistory[0]?.id || "");
      return nextHistory;
    });
  }

  async function sendPromptToApi(finalPrompt) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: finalPrompt })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "The server could not generate a response.");
    }

    return payload.response;
  }

  async function submitPrompt(nextPrompt, languageOverride = selectedGeneratorLanguage) {
    const finalPrompt = createModePrompt(nextPrompt, activeQuickAction, languageOverride);
    const pendingId = getMessageId();

    pendingScrollMode.current = "bottom";
    setMessages((current) => [
      ...current,
      { id: getMessageId(), role: "user", content: nextPrompt },
      { id: pendingId, role: "assistant", content: "Thinking...", pending: true }
    ]);
    setIsLoading(true);
    setPrompt("");

    try {
      const reply = await sendPromptToApi(finalPrompt);
      pendingScrollMode.current = "assistant-top";
      setMessages((current) =>
        current.map((message) => (
          message.id === pendingId
            ? { id: pendingId, role: "assistant", content: reply, pending: false }
            : message
        ))
      );
      addConversationToHistory(nextPrompt, reply);
    } catch (error) {
      const errorReply = `### Error\n\n${error.message}`;
      pendingScrollMode.current = "assistant-top";
      setMessages((current) =>
        current.map((message) => (
          message.id === pendingId
            ? { id: pendingId, role: "assistant", content: errorReply, pending: false }
            : message
        ))
      );
      addConversationToHistory(nextPrompt, errorReply);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function appendAssistantNotice(content) {
    pendingScrollMode.current = "assistant-top";
    setMessages((current) => [...current, { id: getMessageId(), role: "assistant", content, pending: false }]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    if (activeQuickAction === QUICK_ACTION_EXPLAIN && !looksLikeCode(trimmedPrompt)) {
      appendAssistantNotice("### Paste Code Only\n\n`Explain Code` mode only works with pasted code. Paste your code snippet first, then send it again.");
      textareaRef.current?.focus();
      return;
    }

    if (activeQuickAction === QUICK_ACTION_GENERATOR) {
      const detectedLanguage = detectRequestedLanguage(trimmedPrompt);

      if (detectedLanguage) {
        setSelectedGeneratorLanguage(detectedLanguage);
        await submitPrompt(trimmedPrompt, detectedLanguage);
        return;
      }

      setPendingGeneratorPrompt(trimmedPrompt);
      setLanguagePickerOpen(true);
      return;
    }

    await submitPrompt(trimmedPrompt);
  }

  async function handleLanguagePick(language) {
    if (!pendingGeneratorPrompt) {
      return;
    }

    setSelectedGeneratorLanguage(language);
    setLanguagePickerOpen(false);
    const queuedPrompt = pendingGeneratorPrompt;
    setPendingGeneratorPrompt("");
    await submitPrompt(queuedPrompt, language);
  }

  async function copyText(value, onDone) {
    try {
      await navigator.clipboard.writeText(value);
      onDone(true);
    } catch {
      onDone(false);
    }
  }

  function handleCopyReply(message) {
    copyText(message.content, (copied) => {
      setCopiedReplyId(copied ? message.id : "");
      window.setTimeout(() => setCopiedReplyId(""), 1600);
    });
  }

  function handleChatClick(event) {
    const button = event.target.closest(".js-copy-code");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const wrapper = button.closest(".js-code-block");
    const code = wrapper?.querySelector("code")?.textContent || "";
    if (!code) {
      return;
    }

    copyText(code, (copied) => {
      button.textContent = copied ? "Copied!" : "Copy failed";
      window.setTimeout(() => {
        button.textContent = "Copy code";
      }, 1600);
    });
  }

  function clearChat() {
    setMessages([]);
    textareaRef.current?.focus();
  }

  function handleQuickActionSelect(actionLabel) {
    setActiveQuickAction(actionLabel);
    setQuickActionsOpen(false);
    setPrompt("");

    if (actionLabel !== QUICK_ACTION_GENERATOR) {
      setPendingGeneratorPrompt("");
      setSelectedGeneratorLanguage("");
    }

    textareaRef.current?.focus();
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-4 md:px-6">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="glass-panel flex flex-col gap-5 rounded-[28px] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">AI Chat</p>
            <h1 className="m-0 text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-black/8 px-4 py-[11px] text-[var(--text)] transition hover:-translate-y-px"
              aria-label="Open history"
            >
              <span className="font-medium">History</span>
              <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-[linear-gradient(135deg,#b91c1c,#9f1239)] px-1.5 text-xs font-bold text-orange-50">
                {history.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-pressed={theme === "dark"}
              className="inline-flex items-center gap-3 text-[var(--text)] transition hover:-translate-y-px"
            >
              <span className="inline-flex h-[30px] w-[54px] items-center rounded-full bg-[linear-gradient(135deg,#f97316,#facc15)] p-[3px]">
                <span
                  className={`h-6 w-6 rounded-full bg-white shadow-[0_6px_18px_rgba(15,23,42,0.24)] transition-transform ${
                    theme === "dark" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </span>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </header>

        <main className="relative mt-5">
          <div
            className={`absolute left-3 top-3 z-10 flex flex-col items-start transition-opacity md:left-[18px] md:top-[18px] ${
              quickActionsHidden ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <button
              type="button"
              aria-expanded={quickActionsOpen}
              aria-controls="quick-actions-menu"
              onClick={() => setQuickActionsOpen((current) => !current)}
              className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-orange-50 shadow-[0_14px_34px_rgba(159,67,24,0.28)] transition hover:-translate-y-px"
            >
              <span className={`text-3xl leading-none transition-transform ${quickActionsOpen ? "rotate-[135deg]" : ""}`}>+</span>
            </button>
            {quickActionsOpen ? (
              <div id="quick-actions-menu" className="mt-3 flex flex-col gap-2.5">
                {QUICK_ACTIONS.map((action) => {
                  const active = activeQuickAction === action.label;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleQuickActionSelect(action.label)}
                      className={`inline-flex min-w-[220px] items-center gap-2.5 rounded-full border px-4 py-3 text-left shadow-[var(--shadow)] transition hover:-translate-y-px ${
                        active
                          ? "border-transparent bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-orange-50"
                          : "border-[var(--panel-border)] bg-white text-[var(--text)]"
                      }`}
                    >
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? "bg-white/20" : "bg-black/8"}`}>
                        {action.icon}
                      </span>
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/8 px-4 py-[11px] text-[var(--text)] transition hover:-translate-y-px md:right-[18px] md:top-[18px]"
          >
            Clear Chat
          </button>

          <section
            ref={chatContainerRef}
            aria-live="polite"
            onClick={handleChatClick}
            onScroll={(event) => {
              const currentScrollTop = event.currentTarget.scrollTop;
              const scrollDelta = currentScrollTop - lastScrollTop.current;

              if (scrollDelta > 6) {
                setQuickActionsHidden(true);
              } else if (scrollDelta < -6 || currentScrollTop <= 8) {
                setQuickActionsHidden(false);
              }

              lastScrollTop.current = currentScrollTop;
            }}
            className="glass-panel min-h-[72vh] max-h-[72vh] overflow-y-auto rounded-[30px] px-[18px] pb-[18px] pt-[82px] md:min-h-[74vh] md:max-h-[74vh] md:px-6 md:pb-6 md:pt-[88px]"
          >
            {messages.length ? (
              <div className="flex flex-col gap-[18px]">
                {messages.map((message) => (
                  <div key={message.id} data-role={message.role}>
                    <MessageCard
                      message={message}
                      copiedReplyId={copiedReplyId}
                      markedApi={markedApi}
                      onCopyReply={handleCopyReply}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[48vh] place-items-center px-6 text-center">
                <div>
                  <p className="mb-2 text-[0.84rem] uppercase tracking-[0.16em] text-[var(--primary)]">Start Chat</p>
                  <h2 className="m-0 text-3xl font-semibold">Talk to Mini-Ai-Assistant.</h2>
                </div>
              </div>
            )}
          </section>
        </main>

        <form
          onSubmit={handleSubmit}
          className="glass-panel sticky bottom-2 mt-3 grid gap-3 rounded-[28px] p-4 md:grid-cols-[1fr_auto] md:gap-[14px]"
        >
          <label className="sr-only" htmlFor="prompt-input">Ask Talk To Mini AI</label>
          <textarea
            id="prompt-input"
            ref={textareaRef}
            value={prompt}
            rows={1}
            maxLength={6000}
            disabled={isLoading}
            placeholder={placeholder}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="min-h-[60px] max-h-[180px] w-full resize-none rounded-[20px] border-0 bg-black/8 px-4 py-3.5 text-[var(--text)] outline-none disabled:cursor-not-allowed disabled:opacity-65"
          />
          <button
            id="submit-button"
            type="submit"
            disabled={isLoading}
            className="h-[60px] min-w-[112px] rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-5 text-orange-50 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>

      <Modal
        open={languagePickerOpen}
        titleId="language-picker-title"
        eyebrow="Code Generator"
        title="Choose A Language"
        copy="Pick the language you want Mini AI Assistant to generate for your prompt."
        onClose={() => {
          setLanguagePickerOpen(false);
          textareaRef.current?.focus();
        }}
        panelClassName="max-w-[760px]"
      >
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CODE_LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => handleLanguagePick(language)}
              className="rounded-[18px] border border-[var(--panel-border)] bg-white/60 px-3 py-3.5 text-[var(--text)] transition hover:-translate-y-px hover:bg-black/8"
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        titleId="history-title"
        eyebrow="Local History"
        title="Conversation History"
        copy="Your questions and AI answers are stored in this browser on your local machine."
        onClose={() => {
          setHistoryOpen(false);
          textareaRef.current?.focus();
        }}
        panelClassName="max-h-[88vh] max-w-[760px] overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-3">
          {history.length ? (
            history.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                expanded={expandedHistoryId === entry.id}
                markedApi={markedApi}
                onToggle={(id) => setExpandedHistoryId((current) => (current === id ? "" : id))}
              />
            ))
          ) : (
            <div className="rounded-[20px] border border-[var(--panel-border)] bg-white/60 p-5">
              <p className="mb-2 text-[0.8rem] uppercase tracking-[0.08em] text-[var(--muted)]">No History Yet</p>
              <p className="m-0 text-[var(--text)]">Your questions and AI answers will appear here after you chat.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
