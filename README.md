# 15 Puzzle Online

15 Puzzle Online is a real-time multiplayer version of the classic sliding tile game, built using Node.js, HTML5, and Socket.IO. Two players compete live to solve a randomly generated puzzle, with synchronized board updates, real-time event handling, and a shared timer.

---

This project includes:
- A **frontend** built with JavaScript and HTML5
- A **Node.js backend** powered by Socket.IO for real-time communication

Two players can join a match, view each other's boards live, and compete in a timed game.

<img width="1646" height="733" alt="Screenshot 2025-07-10 231818" src="https://github.com/user-attachments/assets/bda22bc8-bb2c-4bcf-b46d-7410701c3e44" />

---

## How It Works

- The frontend listens for mouse movements over tiles.
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

## Installation

To run this game, you will need Node.js and npm (Node Package Manager) installed on your system.

1. **Clone the repository into a directory**.

2. **Install Dependencies**:  
   Navigate to the directory containing `backend.js` in your terminal and install the required Node.js packages:  
   `npm install express socket.io`

3. **Start the Backend Server**:  
  From the same directory, run the backend server:  
  `node backend.js`

You should see `Listening on port 3000` and `Server loaded` messages in your terminal.

4. **Open in Browser**:  
Open your web browser and go to `http://localhost:3000`.
Enter a username and click "Join" to start playing. Open another tab or browser window to play against yourself or have a second player join.

---
