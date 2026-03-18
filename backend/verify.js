const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "frontend/index.html",
  "frontend/style.css",
  "frontend/script.js",
  "backend/server.js",
  ".env",
  ".gitignore"
];

const requiredPackageScripts = ["start", "dev", "verify"];
const requiredDependencies = [
  "express",
  "cors",
  "dotenv",
  "@google/genai",
  "marked",
  "highlight.js"
];

const checks = [];

function assert(condition, label) {
  if (!condition) {
    throw new Error(label);
  }
  checks.push(label);
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

try {
  requiredFiles.forEach((file) => {
    assert(fs.existsSync(path.join(__dirname, "..", file)), `Found ${file}`);
  });

  const packageJson = JSON.parse(read("package.json"));
  requiredPackageScripts.forEach((script) => {
    assert(Boolean(packageJson.scripts?.[script]), `package.json includes "${script}" script`);
  });
  requiredDependencies.forEach((dependency) => {
    assert(Boolean(packageJson.dependencies?.[dependency]), `package.json includes ${dependency}`);
  });

  const html = read("frontend/index.html");
  assert(html.includes("theme-toggle"), "HTML includes dark mode toggle");
  assert(html.includes("clear-chat"), "HTML includes clear chat button");
  assert(html.includes("chat-form"), "HTML includes chat form");
  assert(html.includes("vendor/marked/marked.umd.js"), "HTML loads marked");
  assert(html.includes("vendor/highlight/highlight.min.js"), "HTML loads highlight.js");

  const css = read("frontend/style.css");
  assert(css.includes("body.dark"), "CSS includes dark mode styles");
  assert(css.includes("@media (max-width: 720px)"), "CSS includes mobile responsive rules");
  assert(css.includes(".message.assistant"), "CSS styles assistant messages");
  assert(css.includes(".message.user"), "CSS styles user messages");

  const script = read("frontend/script.js");
  [
    "const messages = [];",
    "localStorage",
    "marked.parse",
    "hljs.highlightElement",
    "navigator.clipboard.writeText",
    "textarea.addEventListener(\"keydown\"",
    "clearChatButton.addEventListener(\"click\"",
    "themeToggle.addEventListener(\"click\""
  ].forEach((snippet) => {
    assert(script.includes(snippet), `Frontend script includes ${snippet}`);
  });

  const server = read("backend/server.js");
  [
    "express.json",
    "cors()",
    "GoogleGenAI",
    "app.post(\"/api/chat\"",
    "generateContent",
    "GEMINI_API_KEY"
  ].forEach((snippet) => {
    assert(server.includes(snippet), `Server includes ${snippet}`);
  });

  const env = read(".env");
  assert(env.includes("GEMINI_API_KEY="), ".env includes GEMINI_API_KEY");

  const gitignore = read(".gitignore");
  assert(gitignore.includes(".env"), ".gitignore ignores .env");

  console.log("Verification passed.");
  checks.forEach((check) => console.log(`- ${check}`));
} catch (error) {
  console.error("Verification failed.");
  console.error(error.message);
  process.exit(1);
}
