import {WIDTH, HEIGHT, Controls} from "./Controls.js";
import BulletController from "./BulletController.js";

window.addEventListener("DOMContentLoaded", () => {
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket(getWebSocketServer());

  // Initialize the UI.
  const canvas = document.getElementById("game");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // get canvas context
  const ctx = canvas.getContext("2d");

  // Initilize the game
  let player = initGame(websocket, canvas, ctx);
  let player1 = player.color === 'yellow' ? player : null;
  let player2 = player.color === 'lightgreen' ? player : null;
  // update UI
  reflectOnGame(canvas, ctx, player1, player2);
  // recieve moves
  receiveMoves(canvas, ctx, player, websocket);
  // send moves
  sendMoves(canvas, ctx, player1, player2, websocket);
});


function initGame(websocket, canvas, ctx) {
  const params = new URLSearchParams(window.location.search);
  // find who is the player
  const color = params.has("join") ? 'lightgreen' : 'yellow';
  const offset = params.has("join") ? 6.3 : 1.3;
  // Initialize new bulletController
  const bulletController = new BulletController(color, null, 0);
  websocket.addEventListener("open", () => {
    // Send an "init" event according to who is connecting.
    let event = { type: "init" };
    if (params.has("join")) {
      // Second player joins an existing game.
      event.join = params.get("join");
    } else if (params.has("watch")) {
      // Spectator watches an existing game.
      event.watch = params.get("watch");
      // Spectator should not have any actions
      document.querySelector(".actions").remove();
    } else {
      // First player starts a new game.
    }
    event.player = new Controls(
        canvas.width / 2.2,
        canvas.height / offset, // Position of player
        color, // Color of player
        100,
        bulletController
    );
    websocket.send(JSON.stringify(event));
  });
  // Initialize new player
  return new Controls(
      canvas.width / 2.2,
      canvas.height / offset, // Position of player
      color, // Color of player
      100,
      bulletController
  );
}


function receiveMoves(canvas, ctx, player, websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
//    console.log('recieve', event);

    switch (event.type) {
      case "init":
        // Create links for inviting the second player and spectators.
        document.querySelector(".join").href = "?join=" + event.join;
        document.querySelector(".watch").href = "?watch=" + event.watch;
        break;
      case "play":
        // get player
        if(player.color === 'yellow') {
          if(event.player['lightgreen']) {
            const playerData = event.player['lightgreen'];
            const bulletController = new BulletController('lightgreen',
                playerData.bulletController.bullets,
                playerData.bulletController.timerTillNextBullet);
            let player2 = new Controls(
                playerData.x,
                playerData.y,
                playerData.color,
                playerData.health,
                bulletController
            );
            // Update the UI with the move.
            reflectOnGame(canvas, ctx, player, player2);
          }
        }else {
          if(event.player['yellow']) {
            const playerData = event.player['yellow'];
            const bulletController = new BulletController('yellow',
                playerData.bulletController.bullets,
                playerData.bulletController.timerTillNextBullet);
            let player1 = new Controls(
                playerData.x,
                playerData.y,
                playerData.color,
                playerData.health,
                bulletController
            );
            // Update the UI with the move.
            reflectOnGame(canvas, ctx, player1, player);
          }
        }
        break;
      case "win":
        // showMessage(`Player ${player.color} wins!`);
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}


function sendMoves(canvas, ctx, player1, player2, websocket) {
  // Don't send moves for a spectator watching a game.
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) {
    return;
  }
  // When a key down, send a "play" event for both players.
  document.addEventListener("keydown",({}) => {
//    console.log('send', typeof(player1), player1);
//    console.log('send', typeof(player2), player2);
    if(player1) {
      document.addEventListener("keydown", player1.keydown);
      player1.intId = setInterval(reflectOnGame, 1000 / 60, canvas, ctx, player1, player2);
      const event = {
        type: "play",
        player: player1,
      };
      websocket.send(JSON.stringify(event));
    }
    if(player2) {
      document.addEventListener("keydown", player2.keydown);
      player2.intId = setInterval(reflectOnGame, 1000 / 60, canvas, ctx, player1, player2);
      const event = {
        type: "play",
        player: player2,
      };
      websocket.send(JSON.stringify(event));
    }
  });
  // When a key up, send a "play" event for both players.
  document.addEventListener("keyup",({}) => {
//    console.log('send', typeof(player1), player1);
//    console.log('send', typeof(player2), player2);
    if(player1) {
      document.addEventListener("keyup", player1.keyup);
      player1.intId = setInterval(reflectOnGame, 1000 / 60, canvas, ctx, player1, player2);
      const event = {
        type: "play",
        player: player1,
      };
      websocket.send(JSON.stringify(event));
    }
    if(player2) {
      document.addEventListener("keyup", player2.keyup);
      player2.intId = setInterval(reflectOnGame, 1000 / 60, canvas, ctx, player1, player2);
      const event = {
        type: "play",
        player: player2,
      };
      websocket.send(JSON.stringify(event));
    }
  });
}

// show warning message function.
function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

// find the url of the websocket to use.
function getWebSocketServer() {
  if (window.location.host === "eysan.github.io") {
    return "wss://pyws-fighters.herokuapp.com/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

// update UI.
function reflectOnGame(canvas, ctx, player1, player2) {
  setCommonStyle(canvas, ctx);
  if(player1){
    player1.bulletController.draw(ctx);
    player1.draw(ctx);
//    console.log('player1', player1.color, player1.intId)
    clearInterval(player1.intId);
  }
  if(player2){
    player2.bulletController.draw(ctx);
    player2.draw(ctx);
//    console.log('player2', player2.color, player2.intId)
    clearInterval(player2.intId);
  }
}

// Used in update UI.
function setCommonStyle(canvas, ctx) {
  ctx.shadowColor = "#d53";
  ctx.shadowBlur = 20;
  ctx.lineJoin = "bevel";
  ctx.lineWidth = 5;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

