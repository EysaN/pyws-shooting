#!/usr/bin/env python

import websockets
import asyncio
import secrets
import signal
import json
import os

from fighters import Fighter, PLAYER1, PLAYER2

COMPETITORS = {}

WATCHERS = {}

PLAYERS = {}


async def error(websocket, message):
    """
    Send an error message.

    """
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))


async def replay(websocket, game):
    """
    Send previous moves.

    """
    # Make a copy to avoid an exception if game.moves changes while iteration
    # is in progress. If a move is played while replay is running, moves will
    # be sent out of order but each move will be sent once and eventually the
    # UI will be consistent.
    for x, y, color, health, bulletController in game.stats.copy():
        event = {
            "type": "play",
            "x": x,
            "y": y,
            "color": color,
            "health": x,
            "bulletController": bulletController,
        }
        await websocket.send(json.dumps(event))


async def play(websocket, game, player_color, connected):
    """
    Receive and process moves from a player.

    """
    async for message in websocket:
        # Parse a "play" event from the UI.
        event = json.loads(message)
        assert event["type"] == "play"
        print(event)
        PLAYERS[player_color] = event["player"]
        print(PLAYERS)

        try:
            # Play a move.
            # move = game.play(PLAYERS[player_color])
            pass
        except RuntimeError as exc:
            # Send an "error" event if the move was illegal.
            await error(websocket, str(exc))
            continue

        # Send a "play" event to update the UI.
        event = {
            "type": "play",
            "player": PLAYERS,
        }
        websockets.broadcast(connected, json.dumps(event))

        # If move is winning, send a "win" event.
        # if game.has_lost:
        #     event = {
        #         "type": "lost",
        #         "player": player,
        #     }
        #     websockets.broadcast(connected, json.dumps(event))


async def start(websocket):
    """
    Handle a connection from the first player: start a new game.

    """
    # Initialize a Connect Four game, the set of WebSocket connections
    # receiving moves from this game, and secret access tokens.
    game = Fighter()
    connected = {websocket}

    join_key = secrets.token_urlsafe(12)
    COMPETITORS[join_key] = game, connected

    watch_key = secrets.token_urlsafe(12)
    WATCHERS[watch_key] = game, connected

    try:
        # Send the secret access tokens to the browser of the first player,
        # where they'll be used for building "join" and "watch" links.
        event = {
            "type": "init",
            "join": join_key,
            "watch": watch_key,
        }
        await websocket.send(json.dumps(event))
        # Receive and process moves from the first player.
        await play(websocket, game, PLAYER1, connected)
    finally:
        del COMPETITORS[join_key]
        del WATCHERS[watch_key]


async def join(websocket, join_key):
    """
    Handle a connection from the second player: join an existing game.

    """
    # Find the Connect Four game.
    try:
        game, connected = COMPETITORS[join_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # Send the first move, in case the first player already played it.
        await replay(websocket, game)
        # Receive and process moves from the second player.
        await play(websocket, game, PLAYER2, connected)
    finally:
        connected.remove(websocket)


async def watch(websocket, watch_key):
    """
    Handle a connection from a spectator: watch an existing game.

    """
    # Find the Connect Four game.
    try:
        game, connected = WATCHERS[watch_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # Send previous moves, in case the game already started.
        await replay(websocket, game)
        # Keep the connection open, but don't receive any messages.
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)


async def handler(websocket, path):
    """
    Handle a connection and dispatch it according to who is connecting.

    """
    # Receive and parse the "init" event from the UI.
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"
    print(event)
    if event.get("player"):
        PLAYERS[event["player"]["color"]] = event["player"]

    if "join" in event:
        # Second player joins an existing game.
        await join(websocket, event["join"])
        PLAYERS[event["player"]["color"]] = event["player"]
    elif "watch" in event:
        # Spectator watches an existing game.
        await watch(websocket, event["watch"])
    else:
        # First player starts a new game.
        await start(websocket)


async def main():
    # Set the stop condition when receiving SIGTERM.
    loop = asyncio.get_running_loop()
    stop = loop.create_future()
    # loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

    port = int(os.environ.get("PORT", "8001"))
    async with websockets.serve(handler, "", port):
        await stop


if __name__ == "__main__":
    asyncio.run(main())
