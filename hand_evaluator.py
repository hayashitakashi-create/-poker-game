"""
ポーカーの役を判定するモジュール
"""
from typing import List, Tuple
from collections import Counter
from enum import Enum
from card import Card, Rank


class HandRank(Enum):
    """役のランク（強さ）"""
    HIGH_CARD = (1, "ハイカード")
    ONE_PAIR = (2, "ワンペア")
    TWO_PAIR = (3, "ツーペア")
    THREE_OF_A_KIND = (4, "スリーカード")
    STRAIGHT = (5, "ストレート")
    FLUSH = (6, "フラッシュ")
    FULL_HOUSE = (7, "フルハウス")
    FOUR_OF_A_KIND = (8, "フォーカード")
    STRAIGHT_FLUSH = (9, "ストレートフラッシュ")
    ROYAL_FLUSH = (10, "ロイヤルフラッシュ")

    def __init__(self, value: int, display: str):
        self.value = value
        self.display = display

    def __lt__(self, other):
        return self.value < other.value


class HandEvaluator:
    """ポーカーの役を評価するクラス"""

    @staticmethod
    def evaluate(cards: List[Card]) -> Tuple[HandRank, List[int]]:
        """
        7枚のカードから最高の役を判定

        Returns:
            Tuple[HandRank, List[int]]: 役のランクとキッカー（タイブレーク用）
        """
        if len(cards) != 7:
            raise ValueError("カードは7枚必要です")

        # すべての5枚の組み合わせを評価
        from itertools import combinations
        best_hand = None
        best_rank = HandRank.HIGH_CARD
        best_kickers = []

        for combo in combinations(cards, 5):
            hand_cards = list(combo)
            rank, kickers = HandEvaluator._evaluate_five_cards(hand_cards)

            if rank.value > best_rank.value or (
                rank.value == best_rank.value and kickers > best_kickers
            ):
                best_rank = rank
                best_kickers = kickers
                best_hand = hand_cards

        return best_rank, best_kickers

    @staticmethod
    def _evaluate_five_cards(cards: List[Card]) -> Tuple[HandRank, List[int]]:
        """5枚のカードから役を判定"""
        sorted_cards = sorted(cards, key=lambda c: c.rank.value, reverse=True)
        ranks = [card.rank.value for card in sorted_cards]
        suits = [card.suit for card in sorted_cards]

        is_flush = len(set(suits)) == 1
        is_straight = HandEvaluator._is_straight(ranks)

        # A-2-3-4-5のストレート（ホイール）を特別処理
        is_wheel = ranks == [14, 5, 4, 3, 2]
        if is_wheel:
            is_straight = True
            ranks = [5, 4, 3, 2, 1]  # Aを1として扱う

        rank_counts = Counter(ranks)
        counts = sorted(rank_counts.values(), reverse=True)
        unique_ranks = sorted(rank_counts.keys(), key=lambda r: (rank_counts[r], r), reverse=True)

        # ロイヤルフラッシュ
        if is_flush and is_straight and ranks[0] == 14 and not is_wheel:
            return HandRank.ROYAL_FLUSH, ranks

        # ストレートフラッシュ
        if is_flush and is_straight:
            return HandRank.STRAIGHT_FLUSH, ranks

        # フォーカード
        if counts == [4, 1]:
            return HandRank.FOUR_OF_A_KIND, unique_ranks

        # フルハウス
        if counts == [3, 2]:
            return HandRank.FULL_HOUSE, unique_ranks

        # フラッシュ
        if is_flush:
            return HandRank.FLUSH, ranks

        # ストレート
        if is_straight:
            return HandRank.STRAIGHT, ranks

        # スリーカード
        if counts == [3, 1, 1]:
            return HandRank.THREE_OF_A_KIND, unique_ranks

        # ツーペア
        if counts == [2, 2, 1]:
            return HandRank.TWO_PAIR, unique_ranks

        # ワンペア
        if counts == [2, 1, 1, 1]:
            return HandRank.ONE_PAIR, unique_ranks

        # ハイカード
        return HandRank.HIGH_CARD, ranks

    @staticmethod
    def _is_straight(ranks: List[int]) -> bool:
        """ストレートかどうかを判定"""
        if len(ranks) != 5:
            return False

        # 通常のストレート
        if ranks[0] - ranks[4] == 4 and len(set(ranks)) == 5:
            return True

        # A-2-3-4-5のストレート（ホイール）
        if ranks == [14, 5, 4, 3, 2]:
            return True

        return False

    @staticmethod
    def compare_hands(hand1: Tuple[HandRank, List[int]],
                     hand2: Tuple[HandRank, List[int]]) -> int:
        """
        2つの役を比較

        Returns:
            1: hand1の勝ち
            -1: hand2の勝ち
            0: 引き分け
        """
        rank1, kickers1 = hand1
        rank2, kickers2 = hand2

        if rank1.value > rank2.value:
            return 1
        elif rank1.value < rank2.value:
            return -1
        else:
            # 同じ役の場合、キッカーで比較
            for k1, k2 in zip(kickers1, kickers2):
                if k1 > k2:
                    return 1
                elif k1 < k2:
                    return -1
            return 0
