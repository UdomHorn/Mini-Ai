# 📄 Project Specification: AI Chat Web App (Gemini API)

## 1. 📌 Overview

Build a lightweight full-stack AI chat application where users can input prompts and receive responses from the Gemini API. The app will support markdown rendering, syntax highlighting, chat history, and a clean UI with dark mode.

---

## 2. 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript (Vanilla)

### Backend

* Node.js
* Express.js

### API

* Gemini API (Google Generative AI)

---

## 3. 🎯 Core Features

### 3.1 User Input

* Text input area (textarea)
* Press **Enter** to submit (Shift + Enter = new line)
* Submit button (alternative to Enter key)

---

### 3.2 Chat System

* Display conversation in chat format:

  * User messages (right side)
  * AI responses (left side)
* Scrollable chat container
* Maintain session-based chat history (in-memory, no database)

---

### 3.3 Gemini API Integration

* Send user prompt to backend
* Backend forwards request to Gemini API
* Return AI-generated response to frontend
* Handle loading state (e.g., “Thinking...”)

---

## 4. 🧾 Markdown Rendering

Render AI responses as formatted markdown:

### Supported Elements:

* Headings (#, ##, ###)
* Bold (**text**)
* Italic (*text*)
* Lists (ordered & unordered)
* Tables
* Code blocks (```)

### Suggested Libraries:

* `marked` or `markdown-it`

---

## 5. 💻 Code Syntax Highlighting

* Highlight code inside markdown blocks

### Suggested Library:

* `highlight.js` or `Prism.js`

---

## 6. 💬 Chat History

* Store chat messages in frontend state (array)
* Structure:

```js
{
  role: "user" | "assistant",
  content: "message text"
}
```

* Render entire conversation on each update

---

## 7. 🧹 Clear Chat Feature

* Button to clear all messages
* Resets chat history array
* Clears UI instantly

---

## 8. 📋 Copy Response Button

* Each AI response has a "Copy" button
* Copies raw text (not HTML) to clipboard
* Show feedback: “Copied!”

---

## 9. 🌙 Dark Mode

* Toggle switch for dark/light mode

### Behavior:

* Save preference in `localStorage`
* Apply CSS class (e.g., `.dark`)

### Styling:

* Dark background
* Light text
* Adjust code block colors

---

## 10. 🎨 UI/UX Requirements

### Layout:

* Header (App name + dark mode toggle)
* Chat container (center)
* Input area (bottom)

### Design:

* Clean, minimal UI
* Rounded chat bubbles
* Responsive (mobile-friendly)

---

## 11. ⚙️ Backend Specification

### Endpoint:

**POST /api/chat**

### Request:

```json
{
  "prompt": "user input text"
}
```

### Response:

```json
{
  "response": "AI generated text"
}
```

### Responsibilities:

* Receive prompt
* Call Gemini API
* Return formatted response
* Handle errors

---

## 12. 🔐 Environment Variables

* Store API key securely:

```
GEMINI_API_KEY=your_api_key_here
```

---

## 13. ⚡ Optional Enhancements (Future)

* Streaming responses (typing effect)
* Message timestamps
* Export chat
* Multiple conversations
* File upload (images/docs)

---

## 14. 🚀 Project Structure

```
/project-root
  /frontend
    index.html
    style.css
    script.js

  /backend
    server.js

  package.json
```

---

## 15. ✅ Success Criteria

* User can input prompt and receive response
* Markdown renders correctly
* Code blocks are syntax highlighted
* Chat history persists during session
* Dark mode works and saves preference
* Copy and clear chat features work

---

## 16. 🧠 Summary

This is a **minimal but powerful AI chat app** with:

* Clean UI
* Rich text rendering
* Developer-friendly features (code highlight)
* No database or authentication needed

---

**End of Specification**

---

If you want next step, I can generate:

* ✅ Full working code (frontend + backend)
* ✅ Step-by-step build guide
* ✅ UI design (clean modern look)

Just tell me 👍
