# RE:LAY Specification

## Overview

RE:LAY is a decentralized-style social networking application designed to emphasize active reading, intentional composition, and meaningful custody of digital correspondence. Unlike instant messaging platforms, RE:LAY utilizes a slower, custody-based model where users "hold" letters, annotate them, and forward them to a limited number of recipients, creating a traceable lineage of thought.

## Core Architecture

The application implements a split-model architecture to separate content from delivery:

*   **LetterContent**: Immutable storage of the message body, subject, and attachments. Contains a mutable, append-only history of annotations (comments) added as the content traverses the network.
*   **Letter (Envelope)**: A delivery vehicle that points to a `LetterContent` object. Represents a user's custody of a message. Envelopes are unique to each recipient, allowing for individual state management (Read/Unread, Archived, Burnt).

### Data Retention Model

RE:LAY enforces a strict "custody or destruction" policy:
*   **Inbox**: Holds incoming correspondence.
*   **Archive**: A limited storage slot (default 10) for saving letters permanently. Archived letters remain live, receiving updates if the content chain continues elsewhere.
*   **Burn**: Users must explicitly destroy (Burn) letters they do not wish to Archive or Forward.

## Feature Set

### Mailbox Management
*   **Inbox**: Primary queue for incoming letters.
*   **Sent**: A comprehensive log of all outbound correspondence. Displays recipient manifests per letter. Includes Drafts filtering (Drafts do not appear in Sent).
*   **Archive**: Permanent long-term storage for high-value correspondence.
*   **Drafts**: Local workspace for composing letters. Supports saving work-in-progress without transmission.

### Composition Engine
*   **Rich Text**: Markdown-enabled editor for expressive writing.
*   **Media Integration**:
    *   **Image Gallery**: Centralized asset management. Images uploaded once are stored in a personal library for reuse.
    *   **Attachments**: Support for up to 3 high-resolution images per letter.
*   **Recipient Selection**: Multi-select interface with friend network integration.

### Social Graph
*   **Invite System**: Strict invite-only access control. Users generate codes to bring new members into the network.
*   **Connection Protocol**: Users can send Friend Requests directly from the context of a received letter (e.g., connecting with a friend-of-a-friend who forwarded a letter).
*   **Profile Management**: Public profiles displaying referral statistics and user avatars.

### Live Wire
*   A real-time, ephemeral communication channel for immediate network synchronization.
*   Features "Smart Scroll" technology to maintain context during active conversations.

### Network Dynamics
*   **Exponential Propagation**: The protocol is designed for viral, yet controlled, dissemination. As each recipient can forward a letter to multiple new contacts (default limit: 3), a single correspondence can rapidly evolve into an exponentially expanding tree of thought. This allows ideas to traverse the social graph organically, creating a rich, multi-branch lineage from a single origin.

## Technical Specifications

### Frontend
*   **Framework**: React 18 (Vite)
*   **Styling**: TailwindCSS (Custom "Terminal Scriptorium" design system)
*   **State Management**: React Hooks + Parse LiveQuery
*   **Animation**: Framer Motion

### Backend
*   **Server Runtime**: Parse Server (Node.js/Express)
*   **Database**: MongoDB (Structure-aware document storage)
*   **File Storage**: GridFS (for binary image data)
*   **Real-time Layer**: WebSocket-based LiveQuery Server

### Security Environment
*   **Access Control Lists (ACLs)**: Granular per-object permissions ensuring content is visible only to the author and current chain of recipients.
*   **Class Level Permissions (CLPs)**: Strict schema enforcement preventing unauthorized API access.

## License

Proprietary Software. Internal Use Only.
