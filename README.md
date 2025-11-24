# Gastbook

A social media platform built with Next.js, Supabase, and Material-UI.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment variables file:
```bash
cp .env.local.example .env.local
```

3. Create `.env.local` file and fill in your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `NEXT_PUBLIC_GA_ID`: Your Google Analytics ID (optional)
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Your reCAPTCHA v3 site key (optional, for bot protection)
   - `RECAPTCHA_SECRET_KEY`: Your reCAPTCHA v3 secret key (optional, for bot protection)
   
   See `BOT_PROTECTION.md` for detailed bot protection setup instructions.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js app directory with pages and layouts
- `components/` - React components
- `lib/` - Utility functions and Supabase client setup
- `public/` - Static assets and PWA files

## Features

- Progressive Web App (PWA) support
- Material-UI for styling
- Supabase for backend
- Google Analytics ready
- Vercel Analytics ready

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy!

## Next Steps

See `SUPABASE_SETUP.md` for instructions on setting up your Supabase database.

