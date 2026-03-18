# TODO: AI Chat Web App (Gemini API)

## 1. Project Setup
- [x] Create project folder structure
  - [x] /frontend
  - [x] /backend
- [x] Initialize Node.js project (`npm init`)
- [x] Install backend dependencies
  - [x] express
  - [x] cors
  - [ ] node-fetch / axios
  - [x] dotenv
  - [x] `@google/genai` SDK used instead of `node-fetch` / `axios`

---

## 2. Frontend Setup (HTML/CSS/JS)
- [x] Create `index.html`
- [x] Create `style.css`
- [x] Create `script.js`
- [x] Build basic layout:
  - [x] Header (title + dark mode toggle)
  - [x] Chat container
  - [x] Input area (textarea + submit button)

---

## 3. User Input Features
- [x] Add textarea for prompt input
- [x] Submit on Enter key
- [x] Allow Shift + Enter for new line
- [x] Add submit button
- [x] Disable input while loading

---

## 4. Chat UI System
- [x] Create message bubble component
- [x] Style:
  - [x] User messages (right)
  - [x] AI messages (left)
- [x] Make chat container scrollable
- [x] Auto-scroll to latest message

---

## 5. Backend (Express Server)
- [x] Create `server.js`
- [x] Setup Express server
- [x] Enable JSON parsing
- [x] Enable CORS
- [x] Create POST `/api/chat` endpoint

---

## 6. Gemini API Integration
- [x] Store API key in `.env`
- [x] Read API key using dotenv
- [x] Send request to Gemini API
- [x] Return response to frontend
- [x] Handle API errors

---

## 7. Connect Frontend <-> Backend
- [x] Send prompt using `fetch`
- [x] Handle loading state ("Thinking...")
- [x] Display AI response in chat

---

## 8. Markdown Rendering
- [x] Install markdown library:
  - [x] marked OR markdown-it
- [x] Convert AI response to HTML
- [x] Render:
  - [x] Headings
  - [x] Bold / Italic
  - [x] Lists
  - [x] Tables
  - [x] Code blocks

---

## 9. Syntax Highlighting
- [x] Install highlight library:
  - [x] highlight.js OR Prism.js
- [x] Apply highlighting to code blocks
- [x] Style code blocks

---

## 10. Chat History
- [x] Create message array:
  - [x] role (user/assistant)
  - [x] content
- [x] Store messages in memory (frontend)
- [x] Re-render chat on update

---

## 11. Clear Chat Feature
- [x] Add "Clear Chat" button
- [x] Reset chat array
- [x] Clear UI

---

## 12. Copy Response Feature
- [x] Add "Copy" button to AI messages
- [x] Copy raw text to clipboard
- [x] Show "Copied!" feedback

---

## 13. Dark Mode
- [x] Add toggle button
- [x] Create `.dark` CSS class
- [x] Save preference in localStorage
- [x] Load preference on startup

---

## 14. UI/UX Improvements
- [x] Add rounded chat bubbles
- [x] Improve spacing and layout
- [x] Make responsive (mobile-friendly)
- [x] Add hover effects

---

## 15. Environment Setup
- [x] Create `.env` file
- [x] Add:
  - [x] GEMINI_API_KEY
- [x] Ensure `.env` is ignored in `.gitignore`

---

## 16. Final Testing
- [x] Test prompt input
- [x] Test API response
- [x] Test markdown rendering
- [x] Test code highlighting
- [x] Test dark mode
- [x] Test copy button
- [x] Test clear chat
- [x] Fix bugs

---

## 17. Optional Features (Later)
- [ ] Typing/streaming effect
- [ ] Message timestamps
- [ ] Export chat
- [ ] Multiple conversations
- [ ] File upload support

---

## DONE WHEN:
- [x] App works end-to-end
- [x] Clean UI
- [x] No major bugs
- [x] All core features implemented
