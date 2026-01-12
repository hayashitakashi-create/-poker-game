"""
カードとデッキを管理するモジュール
"""
import random
from enum import Enum
from typing import List


class Suit(Enum):
    """スート（マーク）"""
    HEARTS = "♥"
    DIAMONDS = "♦"
    CLUBS = "♣"
    SPADES = "♠"


class Rank(Enum):
    """ランク（数字）"""
    TWO = (2, "2")
    THREE = (3, "3")
    FOUR = (4, "4")
    FIVE = (5, "5")
    SIX = (6, "6")
    SEVEN = (7, "7")
    EIGHT = (8, "8")
    NINE = (9, "9")
    TEN = (10, "10")
    JACK = (11, "J")
    QUEEN = (12, "Q")
    KING = (13, "K")
    ACE = (14, "A")

    def __init__(self, value: int, display: str):
        self.value = value
        self.display = display


class Card:
    """トランプのカード"""

    def __init__(self, suit: Suit, rank: Rank):
        self.suit = suit
        self.rank = rank

    def __str__(self) -> str:
        return f"{self.suit.value}{self.rank.display}"

    def __repr__(self) -> str:
        return self.__str__()

    def __eq__(self, other) -> bool:
        if not isinstance(other, Card):
            return False
        return self.suit == other.suit and self.rank == other.rank

    def __lt__(self, other) -> bool:
        return self.rank.value < other.rank.value

    def __hash__(self) -> int:
        return hash((self.suit, self.rank))


class Deck:
    """トランプのデッキ"""

    def __init__(self):
        self.cards: List[Card] = []
        self.reset()

    def reset(self):
        """デッキをリセットして52枚のカードを生成"""
        self.cards = [
            Card(suit, rank)
            for suit in Suit
            for rank in Rank
        ]

    def shuffle(self):
        """デッキをシャッフル"""
        random.shuffle(self.cards)

    def draw(self) -> Card:
        """カードを1枚引く"""
        if not self.cards:
            raise ValueError("デッキにカードがありません")
        return self.cards.pop()

    def __len__(self) -> int:
        return len(self.cards)
