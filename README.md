# RE:lay

> "A high-stakes protocol for intentional correspondence."

RE:lay is a social network built on digital "chain letters" where scarcity is the core mechanic.

## The Core Protocol

### Scarcity & The Loop
- **The Letter**: Contains a Subject, Body, and up to 3 Images.
- **Participation**: You can add exactly one comment to the sequential list.
- **Hand-off**: You can forward the letter to up to 3 friends.
- **Scarcity Rule**: Once forwarded, the letter is **deleted** from your Mailbox.

### The Archive
- Users can "Archive" up to **10 letters**.
- Archived letters are **read-only**.
- They update in real-time but cannot be commented on or forwarded.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **Backend**: Parse Server + MongoDB
- **Style**: "The Terminal Scriptorium" (Brutalist, Monospaced)
