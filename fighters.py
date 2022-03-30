__all__ = ['PLAYER1', 'PLAYER2', 'Fighter']

import json

PLAYER1, PLAYER2 = "yellow", "lightgreen"


class Fighter:
    """
    A Fighter represent a player.
    a player has: hp attribute (health point)
                : has_lost attribute
                : coords attribute (x, y)
                : bullets attribute
                : play method
                : move method
    """
    def __init__(self):
        self.x = 0
        self.y = 0
        self.color = None
        self.health = 100
        self.bulletController = None
        self.stats = []

    @property
    def has_lost(self):
        return True if self.health == 0 else False

    def play(self, player):
        # if not self.has_lost:
        #     self.health -= 1
        self.x = player.get('x', 0)
        self.y = player.get('y', 0)
        self.color = player.get('color')
        self.health = player.get('health', 0)
        self.bulletController = player.get('bulletController')
        self.stats.append((self.x, self.y, self.color, self.health, self.bulletController))

