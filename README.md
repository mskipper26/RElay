# RE:LAY (LetterApp)

RE:LAY is a slow-social networking application built around the concept of digital letters. It emphasizes meaningful connection over instant gratification, featuring a "Terminal Scriptorium" aesthetic.

## Features

### 📬 The Mailbox
- **Inbox**: Receive digital letters from friends. Letters are held in custody and can be burned or archived.
- **Sent**: A permanent record of your authored content. (Read-only view).
- **Archive**: Keep up to 10 letters permanently. Archived letters update live if new comments are added to the chain.

### ✍️ Composition & Forwarding
- **Compose**: Write letters with rich text (Markdown support) and attach up to 3 images.
- **Forwarding**: Forward received letters to up to 3 friends. Add your own annotation/comment to the chain.
- **Chain History**: View the full lineage of a letter, including who forwarded it and their annotations.

### 🤝 Social Network
- **Invite-Only**: New users need a unique invite code to join.
- **Friend System**: Connect with previous senders directly from a letter.
- **Profiles**: View friend profiles, referral stats, and manage your network.

### ⚡ Live Wire
- **Real-time Chat**: A shared live chat feed for ephemeral communication.
- **Smart Scroll**: Auto-scrolls for new messages only when you are at the bottom of the feed.

## Technology Stack

- **Frontend**: React (Vite), TailwindCSS, Framer Motion
- **Backend**: Parse Server (Node.js/Express)
- **Database**: MongoDB (with GridFS for image storage)
- **Real-time**: Parse LiveQuery (WebSocket)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## License

Private / Proprietary.
