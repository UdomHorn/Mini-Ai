const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const searchForm = document.querySelector(".search-panel");
const textarea = document.getElementById("prompt-input");
const submitButton = document.getElementById("submit-button");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const emptyStateTemplate = document.getElementById("empty-state-template");
const lightThemeLink = document.getElementById("hljs-light-theme");
const darkThemeLink = document.getElementById("hljs-dark-theme");
const languageGrid = document.getElementById("language-grid");
const languageSearch = document.getElementById("language-search");
const categoryFilter = document.getElementById("category-filter");
const resultsCount = document.getElementById("results-count");
const detailTitle = document.getElementById("detail-title");
const detailSummary = document.getElementById("detail-summary");
const detailTopics = document.getElementById("detail-topics");
const detailSteps = document.getElementById("detail-steps");
const detailProject = document.getElementById("detail-project");
const chatToggle = document.getElementById("chat-toggle");
const chatPopup = document.getElementById("chat-popup");
const closeChatButton = document.getElementById("close-chat");

const messages = [];
const STORAGE_KEY = "mini-ai-assistant-theme";
const DEFAULT_PROMPT_PLACEHOLDER = "Type your question here...";
let isLoading = false;
let selectedLanguageId = "javascript";
let activeLanguageId = "javascript";

const languages = [
  {
    id: "javascript",
    title: "JavaScript",
    category: "Web",
    detail:
      "JavaScript powers interactive websites, full-stack apps, browser tools, and many modern frameworks.",
    topics: ["Variables and functions", "DOM and events", "Async programming", "APIs and JSON"],
    steps: [
      "Learn syntax, data types, loops, and functions.",
      "Practice DOM updates, event listeners, and fetch requests.",
      "Build small apps, then move into React, Node.js, or full-stack projects."
    ],
    project: "Create a study planner with task filters, local storage, and a progress chart."
  },
  {
    id: "python",
    title: "Python",
    category: "Automation",
    detail:
      "Python is beginner-friendly and widely used for automation, web development, AI, scripting, and data work.",
    topics: ["Syntax and indentation", "Functions and modules", "File handling", "Libraries and virtual environments"],
    steps: [
      "Start with variables, conditionals, loops, functions, and lists.",
      "Learn file handling, error handling, and package installation.",
      "Choose a path like data science, web apps, or automation and build projects."
    ],
    project: "Build a personal expense tracker that reads CSV files and summarizes monthly spending."
  },
  {
    id: "java",
    title: "Java",
    category: "Backend",
    detail:
      "Java is popular for enterprise systems, Android foundations, APIs, and large-scale backend development.",
    topics: ["Classes and objects", "Collections", "Exception handling", "Spring basics"],
    steps: [
      "Learn object-oriented programming, classes, interfaces, and inheritance.",
      "Study collections, exception handling, and testing.",
      "Build REST APIs and backend services with Spring Boot."
    ],
    project: "Create a student course registration API with authentication and role-based access."
  },
  {
    id: "typescript",
    title: "TypeScript",
    category: "Web",
    detail:
      "TypeScript adds static typing to JavaScript, making larger applications easier to maintain and scale.",
    topics: ["Types and interfaces", "Generics", "Type narrowing", "Framework integration"],
    steps: [
      "Review JavaScript basics before adding TypeScript syntax.",
      "Practice type annotations, interfaces, unions, and generics.",
      "Use TypeScript in frontend or backend apps and refactor code confidently."
    ],
    project: "Build a typed dashboard app with reusable components and API models."
  },
  {
    id: "c",
    title: "C",
    category: "Systems",
    detail:
      "C is foundational for learning memory, operating systems, embedded systems, and low-level programming concepts.",
    topics: ["Pointers", "Memory management", "Structs", "Compilation"],
    steps: [
      "Learn syntax, functions, arrays, and pointers carefully.",
      "Practice manual memory management and struct-based design.",
      "Write console tools and simple systems utilities."
    ],
    project: "Build a command-line contact manager using structs and file storage."
  },
  {
    id: "cpp",
    title: "C++",
    category: "Systems",
    detail:
      "C++ is used for game engines, performance-heavy applications, embedded systems, and high-speed tools.",
    topics: ["Classes", "STL", "Pointers and references", "Performance concepts"],
    steps: [
      "Study core C++ syntax and how it differs from C.",
      "Learn classes, templates, STL containers, and memory safety.",
      "Apply it to performance-sensitive projects like games or simulation tools."
    ],
    project: "Create a text-based RPG engine with inventory, combat, and save files."
  },
  {
    id: "csharp",
    title: "C#",
    category: "App Development",
    detail:
      "C# is great for desktop apps, backend APIs, Unity games, and modern business software.",
    topics: ["OOP", "LINQ", ".NET ecosystem", "ASP.NET basics"],
    steps: [
      "Learn object-oriented syntax, collections, and exception handling.",
      "Practice LINQ, async programming, and project structure.",
      "Move into ASP.NET or Unity depending on your goal."
    ],
    project: "Build a habit tracking web API with ASP.NET and a simple frontend."
  },
  {
    id: "go",
    title: "Go",
    category: "Cloud",
    detail:
      "Go is known for simple syntax, fast compilation, and strong support for concurrent backend and cloud services.",
    topics: ["Structs and interfaces", "Goroutines", "Channels", "HTTP servers"],
    steps: [
      "Learn syntax, structs, functions, and package organization.",
      "Practice concurrency using goroutines and channels.",
      "Build APIs, CLI tools, or cloud services."
    ],
    project: "Create a lightweight URL shortener service with logging and analytics."
  },
  {
    id: "rust",
    title: "Rust",
    category: "Systems",
    detail:
      "Rust focuses on memory safety and performance, making it strong for systems, tooling, and reliable services.",
    topics: ["Ownership", "Borrowing", "Enums and pattern matching", "Cargo tooling"],
    steps: [
      "Understand ownership, borrowing, mutability, and lifetimes at a beginner level.",
      "Practice structs, enums, error handling, and modules.",
      "Build command-line tools, web services, or performance-focused programs."
    ],
    project: "Build a fast command-line file organizer that sorts files by type and date."
  },
  {
    id: "php",
    title: "PHP",
    category: "Backend",
    detail:
      "PHP remains widely used for server-side web development, content platforms, and Laravel applications.",
    topics: ["Server-side basics", "Forms and sessions", "Databases", "Laravel overview"],
    steps: [
      "Learn syntax, arrays, forms, and server request handling.",
      "Connect PHP to a database and practice CRUD operations.",
      "Move into Laravel for structured, modern development."
    ],
    project: "Create a blog platform with login, posts, comments, and database storage."
  },
  {
    id: "ruby",
    title: "Ruby",
    category: "Backend",
    detail:
      "Ruby is expressive and beginner-friendly, especially for web apps and rapid prototyping with Rails.",
    topics: ["Readable syntax", "Classes and modules", "Gems", "Rails patterns"],
    steps: [
      "Start with Ruby syntax, methods, arrays, hashes, and blocks.",
      "Practice object-oriented design and reusable modules.",
      "Build web apps with Ruby on Rails."
    ],
    project: "Build a simple reading journal app with user accounts and book reviews."
  },
  {
    id: "swift",
    title: "Swift",
    category: "Mobile",
    detail:
      "Swift is Apple's primary language for iOS, macOS, watchOS, and modern native app development.",
    topics: ["Optionals", "Structs", "Protocols", "SwiftUI basics"],
    steps: [
      "Learn syntax, optionals, collections, and structs.",
      "Practice protocols, state management, and app navigation.",
      "Build native iOS interfaces with SwiftUI."
    ],
    project: "Create a study timer iPhone app with sessions, streaks, and reminders."
  },
  {
    id: "kotlin",
    title: "Kotlin",
    category: "Mobile",
    detail:
      "Kotlin is concise and modern, widely used for Android apps and JVM-based backend work.",
    topics: ["Null safety", "Data classes", "Coroutines", "Android architecture"],
    steps: [
      "Learn Kotlin syntax, null safety, collections, and classes.",
      "Practice coroutines, reusable functions, and state handling.",
      "Build Android apps or backend services with Kotlin."
    ],
    project: "Build an Android flashcard app with categories, quizzes, and offline saving."
  },
  {
    id: "dart",
    title: "Dart",
    category: "Cross-Platform",
    detail:
      "Dart is the language behind Flutter, making it useful for fast cross-platform mobile and desktop apps.",
    topics: ["Classes and constructors", "Async futures", "Widgets", "State management"],
    steps: [
      "Learn Dart syntax, classes, and asynchronous programming.",
      "Understand Flutter widgets, layout, and state management.",
      "Build one responsive app that runs across multiple devices."
    ],
    project: "Create a habit reminder app in Flutter with charts and notifications."
  },
  {
    id: "sql",
    title: "SQL",
    category: "Data",
    detail:
      "SQL is essential for storing, querying, and analyzing structured data in almost every software stack.",
    topics: ["SELECT and filtering", "JOINs", "Aggregations", "Database design basics"],
    steps: [
      "Learn table structure, SELECT queries, filtering, and sorting.",
      "Practice joins, grouping, subqueries, and normalization.",
      "Use SQL with a real app or reporting workflow."
    ],
    project: "Design a learning platform database and write reports for student activity."
  },
  {
    id: "r",
    title: "R",
    category: "Data",
    detail:
      "R is built for statistics, data visualization, and research-focused analysis workflows.",
    topics: ["Vectors and data frames", "Visualization", "Packages", "Statistical workflows"],
    steps: [
      "Learn data structures, functions, and script basics.",
      "Use tidyverse tools for cleaning and visualizing data.",
      "Apply statistical models to real datasets."
    ],
    project: "Analyze student performance data and visualize trends in an R report."
  },
  {
    id: "matlab",
    title: "MATLAB",
    category: "Scientific",
    detail:
      "MATLAB is widely used in engineering, simulation, mathematical modeling, and academic research.",
    topics: ["Matrices", "Plotting", "Scripts and functions", "Simulation tools"],
    steps: [
      "Learn matrices, vectors, scripts, and built-in mathematical functions.",
      "Practice plotting and numerical analysis workflows.",
      "Apply MATLAB to engineering or signal-processing projects."
    ],
    project: "Build a small signal analysis dashboard with plotted waveforms and filters."
  },
  {
    id: "scala",
    title: "Scala",
    category: "Backend",
    detail:
      "Scala combines object-oriented and functional programming, often used in data and backend systems.",
    topics: ["Immutable data", "Case classes", "Functional patterns", "JVM integration"],
    steps: [
      "Learn syntax, functions, and immutable collection usage.",
      "Study case classes, pattern matching, and higher-order functions.",
      "Use Scala in backend services or data processing workflows."
    ],
    project: "Create a recommendation service that ranks learning resources by user interest."
  },
  {
    id: "elixir",
    title: "Elixir",
    category: "Backend",
    detail:
      "Elixir is built for scalable, fault-tolerant applications and real-time systems.",
    topics: ["Functional basics", "Pattern matching", "Processes", "Phoenix framework"],
    steps: [
      "Learn immutable data, functions, and pattern matching.",
      "Explore lightweight processes and concurrency concepts.",
      "Build real-time apps with Phoenix."
    ],
    project: "Make a live classroom Q&A board where messages update instantly."
  },
  {
    id: "lua",
    title: "Lua",
    category: "Scripting",
    detail:
      "Lua is lightweight and often used for game scripting, embedded tools, and automation inside other applications.",
    topics: ["Tables", "Functions", "Embedding", "Game scripting"],
    steps: [
      "Learn syntax, tables, loops, and simple modules.",
      "Practice Lua scripting inside a host application or game environment.",
      "Build reusable gameplay or automation scripts."
    ],
    project: "Write a set of game ability scripts with cooldowns and status effects."
  },
  {
    id: "haskell",
    title: "Haskell",
    category: "Functional",
    detail:
      "Haskell is excellent for learning pure functional programming and strong type-driven design.",
    topics: ["Pure functions", "Type system", "Recursion", "Monads at a beginner level"],
    steps: [
      "Start with expressions, functions, lists, and recursion.",
      "Learn types, pattern matching, and composition.",
      "Build small functional programs before exploring advanced abstractions."
    ],
    project: "Create a command-line quiz app that tracks scores with pure functions."
  },
  {
    id: "perl",
    title: "Perl",
    category: "Scripting",
    detail:
      "Perl is useful for text processing, automation, legacy systems, and quick scripting tasks.",
    topics: ["Regular expressions", "Text processing", "Scripts", "System automation"],
    steps: [
      "Learn Perl syntax, arrays, hashes, and script execution.",
      "Practice regular expressions and file processing.",
      "Automate reporting or batch text transformations."
    ],
    project: "Build a log parser that extracts warnings, errors, and summary metrics."
  },
  {
    id: "objective-c",
    title: "Objective-C",
    category: "Mobile",
    detail:
      "Objective-C still matters for maintaining legacy Apple apps and understanding older iOS codebases.",
    topics: ["Message passing", "Classes", "Memory concepts", "iOS interoperability"],
    steps: [
      "Learn the syntax style, objects, and method calls.",
      "Understand how Objective-C integrates with Apple frameworks.",
      "Practice reading and updating older app modules."
    ],
    project: "Update a legacy note-taking app screen and add a search feature."
  },
  {
    id: "shell",
    title: "Shell / Bash",
    category: "Automation",
    detail:
      "Shell scripting is essential for command-line automation, DevOps workflows, and server management.",
    topics: ["Commands and pipes", "Variables", "Loops", "Automation scripts"],
    steps: [
      "Learn navigation, file commands, pipes, and redirection.",
      "Practice variables, conditionals, loops, and reusable scripts.",
      "Automate development setup, backups, or server tasks."
    ],
    project: "Create a deployment helper script that checks environment setup and runs backups."
  }
];

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
  role.textContent = message.role === "user" ? "You" : "Mini-Ai-Assistant";
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

function getFilteredLanguages() {
  const query = languageSearch.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value.toLowerCase();
  const queryWords = query.split(/\s+/).filter(Boolean);

  return languages.filter((language) => {
    const title = language.title.toLowerCase();
    const id = language.id.toLowerCase();
    const category = language.category.toLowerCase();
    const detail = language.detail.toLowerCase();
    const topics = language.topics.join(" ").toLowerCase();
    const searchableParts = [title, id, category, detail, topics];

    const matchesQuery = !queryWords.length || queryWords.every((word) =>
      searchableParts.some((part) => part.includes(word))
    );
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;

    return matchesQuery && matchesCategory;
  });
}

function updateResultsCount(count) {
  resultsCount.textContent = `${count} ${count === 1 ? "language" : "languages"}`;
}

function populateCategoryFilter() {
  const categories = [...new Set(languages.map((language) => language.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.toLowerCase();
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function selectLanguage(languageId) {
  const language = languages.find((item) => item.id === languageId);

  if (!language) {
    return;
  }

  selectedLanguageId = language.id;
  detailTitle.textContent = language.title;
  detailSummary.textContent = language.detail;
  detailProject.textContent = language.project;

  detailTopics.innerHTML = "";
  language.topics.forEach((topic) => {
    const item = document.createElement("li");
    item.textContent = topic;
    detailTopics.appendChild(item);
  });

  detailSteps.innerHTML = "";
  language.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    detailSteps.appendChild(item);
  });

  setActiveLanguage(language.id);
}

function setActiveLanguage(languageId) {
  activeLanguageId = languageId;

  document.querySelectorAll(".language-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.languageId === activeLanguageId);
  });
}

function openChat(prompt = "") {
  chatPopup.classList.remove("hidden");
  chatToggle.setAttribute("aria-expanded", "true");
  textarea.placeholder = prompt || DEFAULT_PROMPT_PLACEHOLDER;
  autoResizeTextarea();

  textarea.focus();
}

function closeChat() {
  chatPopup.classList.add("hidden");
  chatToggle.setAttribute("aria-expanded", "false");
}

function createLanguageCard(language) {
  const article = document.createElement("article");
  article.className = "language-card";
  article.dataset.languageId = language.id;

  const topicsMarkup = language.topics
    .slice(0, 3)
    .map((topic) => `<span class="topic-pill">${escapeHtml(topic)}</span>`)
    .join("");

  article.innerHTML = `
    <div class="language-card-header">
      <div>
        <h3>${escapeHtml(language.title)}</h3>
        <p class="language-description">${escapeHtml(language.detail)}</p>
      </div>
      <span class="language-tag">${escapeHtml(language.category)}</span>
    </div>
    <div class="language-topics">${topicsMarkup}</div>
    <div class="language-actions">
      <button class="language-button" type="button" data-action="learn" data-language-id="${escapeHtml(language.id)}">Start learning</button>
    </div>
  `;

  return article;
}

function renderLanguageCards() {
  const filteredLanguages = getFilteredLanguages();
  languageGrid.innerHTML = "";
  updateResultsCount(filteredLanguages.length);

  if (!filteredLanguages.length) {
    const emptyLibrary = document.createElement("div");
    emptyLibrary.className = "empty-library";
    emptyLibrary.textContent = "No language matched your search. Try another keyword.";
    languageGrid.appendChild(emptyLibrary);
    return;
  }

  filteredLanguages.forEach((language) => {
    languageGrid.appendChild(createLanguageCard(language));
  });

  const selectedStillVisible = filteredLanguages.some((language) => language.id === selectedLanguageId);
  const activeStillVisible = filteredLanguages.some((language) => language.id === activeLanguageId);
  setActiveLanguage(activeStillVisible ? activeLanguageId : filteredLanguages[0].id);
  selectLanguage(selectedStillVisible ? selectedLanguageId : filteredLanguages[0].id);
}

function promptForLanguage(languageId) {
  const language = languages.find((item) => item.id === languageId);

  if (!language) {
    return "";
  }

  return `I want to learn ${language.title}. Give me a beginner-friendly study plan, key concepts, and a small practice project.`;
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

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

textarea.addEventListener("input", autoResizeTextarea);
textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  updateTheme(nextTheme);
});

languageSearch.addEventListener("input", () => {
  renderLanguageCards();
});

categoryFilter.addEventListener("change", () => {
  renderLanguageCards();
});

languageGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".language-card");
  const button = event.target.closest(".language-button");

  if (!card) {
    return;
  }

  selectLanguage(card.dataset.languageId);

  if (!button) {
    return;
  }

  document.querySelector(".detail-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

languageGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const button = event.target.closest(".language-button");

  if (!button) {
    return;
  }

  event.preventDefault();
  selectLanguage(button.dataset.languageId);

  document.querySelector(".detail-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

chatToggle.addEventListener("click", () => {
  if (!chatPopup.classList.contains("hidden")) {
    textarea.focus();
    return;
  }

  openChat(promptForLanguage(selectedLanguageId));
});

closeChatButton.addEventListener("click", closeChat);

initializeTheme();
autoResizeTextarea();
populateCategoryFilter();
renderLanguageCards();
renderMessages();
