# 15 Puzzle Online

After learning the basics of web development from [Chris Courses](https://youtu.be/HXquxWtE5vA?si=XqffIVUytveY2Kbd), I created this **real-time online multiplayer version of the classic 15 Puzzle** — a sliding puzzle game where tiles numbered 1 through 15 must be arranged in order.

This project includes:
- A **frontend** built with JavaScript and HTML5
- A **Node.js backend** powered by Socket.IO for real-time communication

Two players can join a match, view each other's boards live, and compete in a timed game.

![Gameplay Screenshot](https://github.com/KiheiCodes/15PuzzleOnline/assets/80540914/476acfd7-7df0-4438-8bd2-4a71560f1134)

---

## How It Works

- The frontend listens for keystrokes (WASD or arrow keys).
- When a player makes a move, the client:
  - Updates their local puzzle board using 15 Puzzle rules
  - Sends a socket event to the server with the move
- The backend:
  - Updates the player's board state server-side
  - Broadcasts updated board data to **both players** every ~15 milliseconds
- Other features:
  - Match start synchronization using UNIX timestamps
  - Real-time puzzle completion detection
  - "Ready" state handling for pre-game logic
  - Procedural random puzzle generation

---

## What I Learned

Building this helped me understand:
- How real-time multiplayer games manage **synchronization** between players
- The complexity behind even simple online games
- Why game engines are so valuablem, even small features require careful architecture and logic

This was a great challenge, and it gave me a deep appreciation for the systems behind the games we play every day.

---

## 📁 Tech Stack

- **Frontend:** HTML5, CSS, JavaScript (Canvas-based rendering)
- **Backend:** Node.js, Socket.IO
