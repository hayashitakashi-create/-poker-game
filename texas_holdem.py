"""
テキサスホールデムのゲームロジック
"""
from typing import List, Optional
from card import Deck, Card
from player import Player, HumanPlayer, AIPlayer
from hand_evaluator import HandEvaluator
import time


class TexasHoldem:
    """テキサスホールデムのゲームクラス"""

    def __init__(self, players: List[Player], small_blind: int = 10, big_blind: int = 20):
        self.players = players
        self.small_blind = small_blind
        self.big_blind = big_blind
        self.deck = Deck()
        self.community_cards: List[Card] = []
        self.pot = 0
        self.current_bet = 0
        self.dealer_position = 0

    def play_hand(self):
        """1ハンドをプレイ"""
        print("\n" + "=" * 50)
        print("新しいハンドを開始します")
        print("=" * 50)

        # プレイヤーをリセット
        for player in self.players:
            player.reset_for_new_hand()

        # デッキをリセットしてシャッフル
        self.deck.reset()
        self.deck.shuffle()
        self.community_cards = []
        self.pot = 0
        self.current_bet = 0

        # ブラインドを徴収
        self._post_blinds()

        # ホールカードを配る
        self._deal_hole_cards()

        # プリフロップ
        print("\n--- プリフロップ ---")
        if not self._betting_round():
            self._show_winner()
            return

        # フロップ
        print("\n--- フロップ ---")
        for _ in range(3):
            self.community_cards.append(self.deck.draw())
        self._show_community_cards()
        if not self._betting_round():
            self._show_winner()
            return

        # ターン
        print("\n--- ターン ---")
        self.community_cards.append(self.deck.draw())
        self._show_community_cards()
        if not self._betting_round():
            self._show_winner()
            return

        # リバー
        print("\n--- リバー ---")
        self.community_cards.append(self.deck.draw())
        self._show_community_cards()
        if not self._betting_round():
            self._show_winner()
            return

        # ショーダウン
        self._showdown()

        # ディーラーボタンを移動
        self.dealer_position = (self.dealer_position + 1) % len(self.players)

    def _post_blinds(self):
        """ブラインドを徴収"""
        sb_pos = (self.dealer_position + 1) % len(self.players)
        bb_pos = (self.dealer_position + 2) % len(self.players)

        sb_player = self.players[sb_pos]
        bb_player = self.players[bb_pos]

        sb_amount = sb_player.bet(self.small_blind)
        bb_amount = bb_player.bet(self.big_blind)

        self.pot += sb_amount + bb_amount
        self.current_bet = self.big_blind

        print(f"{sb_player.name}がスモールブラインド{sb_amount}をベット")
        print(f"{bb_player.name}がビッグブラインド{bb_amount}をベット")

    def _deal_hole_cards(self):
        """各プレイヤーにホールカードを2枚配る"""
        for player in self.players:
            cards = [self.deck.draw(), self.deck.draw()]
            player.receive_cards(cards)

    def _show_community_cards(self):
        """コミュニティカードを表示"""
        print(f"コミュニティカード: {' '.join(str(c) for c in self.community_cards)}")

    def _betting_round(self) -> bool:
        """
        ベッティングラウンドを実行

        Returns:
            bool: ゲームが継続する場合True、1人を除いて全員フォールドした場合False
        """
        # アクティブなプレイヤーのみ
        active_players = [p for p in self.players if p.can_act()]

        if len(active_players) <= 1:
            return False

        # ベッティングラウンドの開始位置
        start_pos = (self.dealer_position + 1) % len(self.players)

        # 全員がアクションを完了するまでループ
        last_raiser = None
        player_index = start_pos
        actions_taken = {p: False for p in self.players}

        while True:
            player = self.players[player_index]

            # アクション可能なプレイヤーのみ
            if player.can_act():
                # 全員が同じベット額になり、全員がアクションを取ったら終了
                all_equal_bets = all(
                    p.current_bet == self.current_bet or not p.can_act()
                    for p in self.players
                )
                all_acted = all(
                    actions_taken[p] or not p.can_act()
                    for p in self.players
                )

                if all_equal_bets and all_acted and last_raiser != player:
                    break

                # プレイヤーのアクション
                self._player_action(player)
                actions_taken[player] = True

                # レイズした場合、最後のレイザーを更新
                if player.current_bet > self.current_bet:
                    last_raiser = player
                    self.current_bet = player.current_bet

            player_index = (player_index + 1) % len(self.players)

            # アクティブなプレイヤーが1人以下になったら終了
            active_players = [p for p in self.players if p.can_act()]
            if len(active_players) <= 1:
                return False

        # 次のラウンドのためにベットをリセット
        for player in self.players:
            player.current_bet = 0
        self.current_bet = 0

        return True

    def _player_action(self, player: Player):
        """プレイヤーのアクションを処理"""
        to_call = self.current_bet - player.current_bet
        min_raise = self.big_blind

        print(f"\n{player.name}のターン")

        # プレイヤーの決定を取得
        action, amount = player.decide_action(self.current_bet, min_raise, self.pot)

        if action == 'fold':
            player.fold()
            print(f"{player.name}はフォールドしました")
        elif action == 'check':
            print(f"{player.name}はチェックしました")
        elif action == 'call':
            actual_amount = player.bet(amount)
            self.pot += actual_amount
            print(f"{player.name}は{actual_amount}をコールしました")
        elif action == 'raise':
            # まずコール分をベット
            call_amount = player.bet(to_call)
            # 次にレイズ分をベット
            raise_amount = player.bet(amount)
            total = call_amount + raise_amount
            self.pot += total
            self.current_bet = player.current_bet
            print(f"{player.name}は{total}にレイズしました")

        time.sleep(0.5)  # 少し待機して読みやすくする

    def _show_winner(self):
        """勝者を表示（フォールドによる勝利）"""
        active_players = [p for p in self.players if not p.folded]

        if len(active_players) == 1:
            winner = active_players[0]
            winner.chips += self.pot
            print(f"\n{winner.name}が{self.pot}チップを獲得しました！")
        else:
            print("\nエラー: 複数のプレイヤーが残っています")

    def _showdown(self):
        """ショーダウン（役の比較）"""
        print("\n" + "=" * 50)
        print("ショーダウン！")
        print("=" * 50)

        active_players = [p for p in self.players if not p.folded]

        # 各プレイヤーの役を評価
        player_hands = []
        for player in active_players:
            all_cards = player.hand + self.community_cards
            hand_rank, kickers = HandEvaluator.evaluate(all_cards)
            player_hands.append((player, hand_rank, kickers))
            print(f"{player.name}: {' '.join(str(c) for c in player.hand)} - {hand_rank.display}")

        # 最強の役を見つける
        player_hands.sort(
            key=lambda x: (x[1].value, x[2]),
            reverse=True
        )

        # 勝者を決定（同点の可能性あり）
        winners = [player_hands[0]]
        for i in range(1, len(player_hands)):
            result = HandEvaluator.compare_hands(
                (player_hands[0][1], player_hands[0][2]),
                (player_hands[i][1], player_hands[i][2])
            )
            if result == 0:
                winners.append(player_hands[i])
            else:
                break

        # ポットを分配
        winnings = self.pot // len(winners)
        print(f"\n勝者:")
        for player, hand_rank, _ in winners:
            player.chips += winnings
            print(f"  {player.name} - {hand_rank.display} (+{winnings}チップ)")

    def eliminate_broke_players(self) -> List[Player]:
        """チップが0のプレイヤーを排除"""
        remaining = [p for p in self.players if p.chips > 0]
        eliminated = [p for p in self.players if p.chips <= 0]

        for player in eliminated:
            print(f"\n{player.name}はチップが無くなり、ゲームから脱落しました")

        self.players = remaining
        return remaining

    def show_chip_counts(self):
        """全プレイヤーのチップ数を表示"""
        print("\n現在のチップ:")
        for player in self.players:
            print(f"  {player.name}: {player.chips}")
