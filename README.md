# 🎬 Helloflix - Premium Anime & Movie Platform

Welcome to **Helloflix**, a high-performance, modern web application for streaming anime and movies. Built with the latest tech stack, it features seamless multi-server support, Hindi dubbed content, and a premium glassmorphic UI.

---

## ✨ Features

- 🎌 **Extensive Anime Library**: Trending, popular, and seasonal anime directly from high-speed APIs.
- 🇮🇳 **Hindi Dubbed Section**: Dedicated focus on Hindi-speaking audiences with a clean, organized layout.
- 🚀 **Edge-Powered Proxies**: Secure video streaming and data fetching via Supabase Edge Functions.
- 🌓 **Dynamic Themes**: Beautiful light and dark modes with unique glassmorphism aesthetics.
- 📱 **Fully Responsive**: Optimized for Mobile, Tablet, and Desktop viewing.
- ⚡ **Lightning Fast**: Powered by Vite and React Query for instant loading and smooth transitions.

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/) (Database + Edge Functions + Auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)

---

## 🚀 Quick Start Guide

Follow these simple steps to get the project running on your local machine.

### 1️⃣ Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 18 or higher)
- [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- A [Supabase account](https://supabase.com/) (Free tier works perfectly!)

### 2️⃣ Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to the folder
cd hianime712

# Install dependencies
npm install
```

<!-- Helps   


https://helloflix.in/
https://helloflix.in/profile
https://helloflix.in/auth
https://helloflix.in


 -->

### 3️⃣ Setup Environment Variables
Create a file named `.env` in the root folder and add your keys:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# API Settings
VITE_HINIME_API_URL=https://hinime-two.vercel.app/api
VITE_ZENIME_PROXY_URL=https://zenime-1-qejh.onrender.com/?url=
```

### 4️⃣ Supabase Configuration (Crucial)
To make the video player and Hindi section work, you must setup your Supabase project:

1.  **Database**: Go to the **SQL Editor** in your Supabase dashboard and run the code provided in `MIGRATION_GUIDE.md`.
2.  **Secrets**: The edge functions need the private API key. Set it in your dashboard or via CLI:
    ```bash
    npx supabase secrets set TATAKAI_API_URL="https://tatakaiapi-one.vercel.app/api/v1"
    ```
3.  **Edge Functions**: Deploy the proxy functions:
    ```bash
    npx supabase functions deploy tatakai-proxy
    npx supabase functions deploy hindi-proxy
    npx supabase functions deploy m3u8-proxy
    npx supabase functions deploy peertube-proxy
    npx supabase functions deploy embed-proxy
    ```

### 5️⃣ Run the App
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser! 🚀

---

## 📖 Deployment
Simply push your changes to GitHub and connect your repository to **Vercel**, **Netlify**, or **Cloudflare Pages**. Remember to add your `.env` variables to the deployment settings.

---

## 🤝 Contribution
Found a bug or want to suggest a feature? Feel free to open an issue or submit a pull request!

---

*Made with ❤️ for the Anime Community.*
