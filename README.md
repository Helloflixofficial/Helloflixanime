# 🎬 Helloflix - Premium Anime & Movie Platform

Welcome to **Helloflix**, a high-performance, modern web application for streaming series and anime. Built with the latest tech stack, it uses the sibling HindMovies catalog API, multi-server playback, and a premium glassmorphic UI.

---

## ✨ Features

- 🎌 **Extensive Anime Library**: Trending, popular, and seasonal anime directly from high-speed APIs.
- 🎬 **Series and Anime Catalog**: Live scraped catalog data from the sibling HindMovies API, including animation, Korean, and Chinese series.
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

# Optional: use the current origin automatically when this is empty
VITE_AUTH_REDIRECT_URL=

# HindMovies API Settings
VITE_HINDMOVIES_API_URL=https://hindmovies-zeta.vercel.app
VITE_HINDMOVIES_VIDEO_PROXY_URL=https://hindmovies.abdullahdaniyal.workers.dev/?url=
```

### 4️⃣ Supabase Configuration (Crucial)
To make authentication, favorites, comments, and watch history work, you must set up your Supabase project:

1.  **Database**: Go to the **SQL Editor** in your Supabase dashboard and run the code provided in `MIGRATION_GUIDE.md`.
2.  **Playback**: The catalog is served by the sibling Vercel API and video URLs are streamed through the sibling Cloudflare Worker configured above. No catalog edge function deployment is required.
3.  **Auth URLs**: In Supabase **Authentication → URL Configuration**, add these redirect URLs:
    - `http://localhost:5173/auth`
    - `http://localhost:5173/reset-password`
    - `https://helloflix.in/auth`
    - `https://helloflix.in/reset-password`
4.  Set the Supabase Site URL to `https://helloflix.in`. Enable the Email provider. For Google login, enable **Google** under **Authentication → Providers**, then add the Google OAuth client ID and secret. In Google Cloud Console, add this authorized redirect URI:
    - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5.  Add the localhost and Vercel URLs above to Supabase **Authentication → URL Configuration**. Google itself redirects to the Supabase callback; Supabase then redirects back to this app's `/auth` route.

### 5️⃣ Run the App
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser! 🚀

---

## 📖 Deployment
Simply push your changes to GitHub and connect your repository to **Vercel**, **Netlify**, or **Cloudflare Pages**. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_HINDMOVIES_API_URL`, and `VITE_HINDMOVIES_VIDEO_PROXY_URL` to the deployment settings, then redeploy. The app uses the current deployment origin for auth callbacks, so the same build works on localhost and Vercel.

---

## 🤝 Contribution
Found a bug or want to suggest a feature? Feel free to open an issue or submit a pull request!

---

*Made with ❤️ for the Anime Community.*
