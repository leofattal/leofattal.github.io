# 🇫🇷 Interactive French AP Learning Platform

## 🧠 Overview

This project aims to bring Veronique’s French AP curriculum online as a structured, interactive web app. Students will access content originally authored in PDF format, now transformed into HTML modules, with the ability to submit answers, receive feedback, and track progress.

The MVP will be built using **vanilla JavaScript** and **Supabase** for backend/auth/data.

---

## 📌 Core Features

### 👩‍🎓 Student Interface
- Sign up / login
- View lessons by module
- Submit written or audio responses
- Get feedback (from teacher or auto-generated)
- See progress and completed exercises

### 👩‍🏫 Teacher/Admin Interface
- Upload/edit lessons
- Review student submissions
- Provide feedback
- Track class and individual progress

---

## 🛠️ Step-by-Step Build Plan (Vanilla JS + Supabase)

### ✅ Phase 1: Setup

1. **Set up Supabase project**
   - Create tables: `users`, `lessons`, `exercises`, `submissions`, `feedback`
   - Enable authentication (email/password)
   - Set up row-level security and policies

2. **Initialize frontend**
   - Basic HTML/CSS structure
   - Vanilla JS project scaffold (modular files, build with Vite or just ES6 modules)
   - Connect frontend to Supabase client

---

### ✅ Phase 2: User Authentication

3. **Implement login/signup**
   - Use Supabase’s JS SDK for auth
   - Simple UI with login, signup, logout
   - Store user session in `localStorage`

---

### ✅ Phase 3: Lesson Viewer

4. **Lesson module viewer**
   - Fetch lessons from `lessons` table
   - Render HTML content (assumes already converted)
   - Display exercises within lesson view

---

### ✅ Phase 4: Exercise Submission

5. **Exercise interaction UI**
   - For each exercise (text or audio):
     - Input fields for written answers
     - Record/upload button for audio (optional)
   - Submit button → store in `submissions` table

6. **Student dashboard**
   - View submitted exercises
   - See teacher feedback (from `feedback` table)
   - Progress bar or checklist per lesson

---

### ✅ Phase 5: Teacher/Admin Tools

7. **Admin login**
   - Detect admin role based on user metadata
   - Display teacher dashboard

8. **Lesson & exercise manager**
   - Upload lesson metadata + HTML content
   - Create/edit exercises per lesson

9. **Submission review UI**
   - List of student submissions per exercise
   - Provide text/audio feedback
   - Save to `feedback` table

---

### ✅ Phase 6: Polishing & Deployment

10. **Basic styling**
    - Use a clean, mobile-friendly CSS framework (e.g. Pico.css or none)
    - Add icons, color, and layout tweaks

11. **Deployment**
    - Host frontend on Netlify or Vercel
    - Set up Supabase environment keys securely

---

## 🧠 Optional Features (Phase 2+)

- AI-generated grammar feedback for student submissions
- Voice pronunciation scoring with Web Speech API or external service
- Chat-based AI tutor
- Gamification: badges, XP, streaks

---

## 📂 Supabase Table Overview

| Table         | Purpose                                  |
|---------------|------------------------------------------|
| `users`       | Auth users, roles (student/teacher)      |
| `lessons`     | Lesson metadata + HTML content           |
| `exercises`   | Individual exercises linked to lessons   |
| `submissions` | Student answers (text/audio)             |
| `feedback`    | Teacher or AI-generated feedback         |

---

## 🚀 Next Steps

1. Finalize product scope and user flows with Alex
2. Convert 1-2 sample PDFs into HTML lessons manually
3. Set up Supabase and basic frontend scaffolding
4. Build MVP lesson viewer + submission system
5. Test with 2–3 students + teacher (Veronique)