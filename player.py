"""
プレイヤーを管理するモジュール
"""
from typing import List, Optional
from card import Card
import random


class Player:
    """ポーカープレイヤーの基底クラス"""

    def __init__(self, name: str, chips: int = 1000):
        self.name = name
        self.chips = chips
        self.hand: List[Card] = []
        self.current_bet = 0
        self.folded = False
        self.all_in = False

    def receive_cards(self, cards: List[Card]):
        """カードを受け取る"""
        self.hand = cards

    def bet(self, amount: int) -> int:
        """ベットする"""
        if amount > self.chips:
            # オールイン
            actual_bet = self.chips
            self.chips = 0
            self.all_in = True
        else:
            actual_bet = amount
            self.chips -= amount

        self.current_bet += actual_bet
        return actual_bet

    def fold(self):
        """フォールドする"""
        self.folded = True

    def reset_for_new_hand(self):
        """新しいハンドのためにリセット"""
        self.hand = []
        self.current_bet = 0
        self.folded = False
        self.all_in = False

    def can_act(self) -> bool:
        """アクション可能かどうか"""
        return not self.folded and not self.all_in

    def __str__(self) -> str:
        return f"{self.name} (チップ: {self.chips})"


class HumanPlayer(Player):
    """人間プレイヤー"""

    def __init__(self, name: str = "あなた", chips: int = 1000):
        super().__init__(name, chips)

    def decide_action(self, current_bet: int, min_raise: int, pot: int) -> tuple[str, int]:
        """
        アクションを決定（人間の入力を受け取る）

        Returns:
            tuple[str, int]: (action, amount)
            action: 'fold', 'call', 'raise', 'check'
        """
        to_call = current_bet - self.current_bet

        print(f"\n{self.name}の手札: {' '.join(str(c) for c in self.hand)}")
        print(f"現在のチップ: {self.chips}")
        print(f"現在のベット: {self.current_bet}")
        print(f"ポット: {pot}")

        while True:
            if to_call == 0:
                print("\n選択肢: [c]heck, [r]aise, [f]old")
                action = input("アクションを選択してください: ").lower().strip()

                if action == 'c':
                    return ('check', 0)
                elif action == 'f':
                    return ('fold', 0)
                elif action == 'r':
                    try:
                        amount = int(input(f"レイズ額を入力してください (最小: {min_raise}): "))
                        if amount < min_raise:
                            print(f"最小レイズ額は{min_raise}です")
                            continue
                        if amount > self.chips:
                            print(f"チップが足りません。最大: {self.chips}")
                            continue
                        return ('raise', amount)
                    except ValueError:
                        print("有効な数字を入力してください")
                        continue
            else:
                print(f"\nコール額: {to_call}")
                print("選択肢: [c]all, [r]aise, [f]old")
                action = input("アクションを選択してください: ").lower().strip()

                if action == 'c':
                    return ('call', to_call)
                elif action == 'f':
                    return ('fold', 0)
                elif action == 'r':
                    try:
                        amount = int(input(f"レイズ額を入力してください (最小: {min_raise}): "))
                        if amount < min_raise:
                            print(f"最小レイズ額は{min_raise}です")
                            continue
                        if amount + to_call > self.chips:
                            print(f"チップが足りません。最大: {self.chips}")
                            continue
                        return ('raise', amount)
                    except ValueError:
                        print("有効な数字を入力してください")
                        continue

            print("無効な入力です。もう一度試してください。")


class AIPlayer(Player):
    """コンピューター（AI）プレイヤー"""

    def __init__(self, name: str, chips: int = 1000, aggression: float = 0.5):
        super().__init__(name, chips)
        self.aggression = aggression  # 0.0(消極的) ~ 1.0(攻撃的)

    def decide_action(self, current_bet: int, min_raise: int, pot: int) -> tuple[str, int]:
        """
        AIのアクションを決定（簡易的な戦略）

        Returns:
            tuple[str, int]: (action, amount)
        """
        to_call = current_bet - self.current_bet

        # 簡易的な確率ベースの判断
        decision = random.random()

        if to_call == 0:
            # チェック可能な場合
            if decision < 0.7:
                return ('check', 0)
            elif decision < 0.85:
                # レイズ
                raise_amount = random.randint(min_raise, min(min_raise * 3, self.chips))
                return ('raise', raise_amount)
            else:
                return ('check', 0)
        else:
            # コールが必要な場合
            if to_call > self.chips * 0.3:
                # 大きなベットに対しては慎重に
                if decision < 0.4 * (1 - self.aggression):
                    return ('fold', 0)
                elif decision < 0.7:
                    return ('call', to_call)
                else:
                    # レイズ
                    if self.chips > to_call + min_raise:
                        raise_amount = random.randint(min_raise, min(min_raise * 2, self.chips - to_call))
                        return ('raise', raise_amount)
                    else:
                        return ('call', to_call)
            else:
                # 小さなベットに対しては積極的に
                if decision < 0.2:
                    return ('fold', 0)
                elif decision < 0.6 + self.aggression * 0.2:
                    return ('call', to_call)
                else:
                    # レイズ
                    if self.chips > to_call + min_raise:
                        raise_amount = random.randint(min_raise, min(min_raise * 3, self.chips - to_call))
                        return ('raise', raise_amount)
                    else:
                        return ('call', to_call)
