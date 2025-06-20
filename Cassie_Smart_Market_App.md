# 🧠 Project Overview: Cassie's Smart Market Assistant

**Working Title:** _MartRuns_ (or customizable)

## 📘 Project Description

This project is a **voice-enabled + visual web application** designed primarily to assist chefs (starting with Cassie) in planning and executing their **market runs efficiently**. The system allows chefs to create shopping lists, manage vendors, track expenses, and receive smart reminders using both **touch input (UI)** and **voice commands**.

It is **built with extensibility in mind**, so other chefs can create their own accounts and personalize their market routines.

---

## 🎯 Core Objectives

- Allow chefs to plan **daily or scheduled market runs**.
- Enable both **manual and voice-based interactions**.
- Offer a clean **UX** for real-time checklisting and market progress.
- Provide **smart suggestions** and reusability of past market runs.
- Keep the interface usable **offline** (PWA-friendly).

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Voice Input:** Web Speech API (initial) or OpenAI Whisper (future)
- **State Management:** Context API / Zustand / Redux (light)
- **Backend:** Firebase or Supabase (Auth + DB)
- **Offline Capability:** Service Workers (PWA support)
- **Optional NLP Layer:** OpenAI or Langchain for command parsing (Phase 2)

---

## 👤 User Roles

- **Chef (default role):** Can create/edit market runs, lists, and notes.
- **Multi-user support:** System will be open to multiple chefs (Cassie is just the first user).
- **User Auth:** Basic signup/login with email or Google (via Firebase/Supabase Auth).

---

## 🧩 Main Features (Grouped by Experience Flow)

### 1. ✍️ Pre-Market Planning

- Create new market run (title + optional schedule)
- Add items manually or via voice (e.g., "Add tomatoes and Maggi")
- Smart suggestions from past runs
- Set budget estimates per item
- Set reminders (e.g., "Remind me by 7AM tomorrow")

### 2. 🛒 In-Market Interaction

- Interactive checklist UI (swipe/tap or voice: "I've bought onions")
- Real-time price entry (voice or touch)
- Note-taking for vendor or quality ("Save this fish vendor")
- Offline-first design (auto-sync when online)

### 3. 📊 Post-Market Summary

- Show total estimated vs actual spend
- Auto-save lists for reuse
- Simple feedback/logging: "This market run was smooth"
- Suggest items to reduce (based on leftovers logged)

---

## 🔊 Voice UI Breakdown

| Voice Example                      | Action                      |
| ---------------------------------- | --------------------------- |
| "I want to go to the market today" | Starts new market run       |
| "Add carrots and beef"             | Adds to current list        |
| "Remind me at 6AM"                 | Sets notification           |
| "I've bought rice"                 | Marks as done               |
| "End this run"                     | Finalizes and shows summary |

---

## 🧠 Smart Features (Future Enhancements)

- Predict frequently forgotten items
- Price trend warnings
- Meal-based list generation (optional link)
- Export to PDF or share with assistants

---

## 🏠 Future Home Page Enhancement Plan

### Enhanced Dashboard Experience

Create an immersive home page interface that makes chefs feel inspired and informed:

#### 🗣️ Daily Chef Inspiration

- **Daily Chef Quotes**: Rotating collection of motivational culinary quotes
- **Cooking Tips**: Professional chef wisdom and market insights
- **Seasonal Reminders**: What's fresh this time of year

#### 📈 Market Run Analytics

- **Today's Progress**: Visual dashboard showing today's market runs and completion status
- **Weekly Overview**: Chart showing market runs per day over the past week
- **Monthly Trends**: Spending patterns and shopping frequency insights
- **Achievement Streaks**: Consecutive days with successful market runs

#### 🕐 Historical Journey

- **Previous Runs Gallery**: Interactive timeline of past market runs with photos and notes
- **Favorite Vendors**: Quick access to frequently visited market stalls
- **Shopping Patterns**: Visual insights into most purchased items and categories
- **Success Metrics**: Total money saved, items purchased, and efficiency improvements

#### 🎯 Smart Recommendations

- **Suggested Lists**: Based on shopping history and seasonal availability
- **Budget Optimization**: Recommendations for better spending
- **Time Efficiency**: Optimal market routes and timing suggestions

#### 🏆 Gamification Elements

- **Chef Level System**: Progress from Novice to Master Chef based on completed runs
- **Market Mastery Badges**: Achievements for consistency, savings, and efficiency
- **Weekly Challenges**: Fun goals like "Try 3 new vendors this week"

This enhanced home experience will make every visit to MartRuns feel rewarding and motivating for professional chefs.

---

## 🎨 UI Design Notes

- Mobile-first UI (touch-friendly)
- Friendly tone (human, gentle prompts)
- Dark mode & accessibility-aware
- "Assistant" component that animates/helps when voice is triggered

---

## 🧪 MVP Milestone Checklist

1. [x] Auth + onboarding screen (multiple chefs support)
2. [x] Market run creation (manual + voice input)
3. [x] Checklist UI
4. [x] Voice-to-text parser (basic Web Speech API)
5. [x] Reminders + vendor notes
6. [x] Post-run summary
7. [ ] PWA setup + offline handling
8. [ ] Smart suggestion engine (phase 2)
9. [ ] Enhanced Home Page Dashboard (future plan)
