After learning the basics of web development from [Chris Courses](https://youtu.be/HXquxWtE5vA?si=XqffIVUytveY2Kbd), I created this online multiplayer game to play someone in a game of 15 Puzzle.

15 Puzzle is a sliding puzzle game in which you number square tiles from 1 through 15.

This repo includes a frontend in JS and HTML and a backend in Node.js. It allows two players to see each other's boards at once and compete in a timed match.

![image](https://github.com/KiheiCodes/15PuzzleOnline/assets/80540914/476acfd7-7df0-4438-8bd2-4a71560f1134)


How it works:
- The frontend listens for key strokes (WASD || arrow keys).
- It updates the player's board based on 15 Puzzle rules and sends an event to the backend ("hey, this user pressed this key").
- The backend updates this player's "backend board", which is then emitted to the frontend (all users) every 15 milliseconds (probably more in a server hosted hundreds of miles away).
- Of course, there is additional data sent and received such as UNIX timestamps (the point in time the user started playing - to keep track of stopwatch), ready status, puzzle completion, generating random boards, etc.

It sounds like a lot because well, it is. I was pretty shocked to realize how much development goes into a simple multiplayer game.

I can only imagine how much effort goes into far more complicated games that we play everyday (although I guess game engines handle a lot of it).
