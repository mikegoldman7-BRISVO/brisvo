# BrisVO Website

BrisVO is a public-facing website for showcasing voice artists and helping clients discover talent, listen to demos, and make enquiries.

It also includes a private artist dashboard for approved users to maintain their own profile content.

## Features

### Public website

- Browse voice talent
- Filter artists by category
- Open artist profiles in a modal
- Listen to demo reels
- Send enquiries
- Join the newsletter

### Private artist dashboard

- Secure sign-in
- Edit profile details
- Manage profile photos
- Manage demo tracks
- Change password
- Reset password by email

## Tech

- React
- Vite
- Supabase

## Local development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment

The project uses environment variables for Supabase configuration.

See `.env.example` for the required keys.

## Notes

- This repository contains both the public website and the private dashboard UI.
- Access to private dashboard actions depends on backend configuration and authenticated user access.
- Sensitive project configuration should stay in environment variables and Supabase project settings, not in the repository.
