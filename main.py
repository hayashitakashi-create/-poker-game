#!/usr/bin/env python3
"""
テキサスホールデム ポーカーゲーム
メインエントリーポイント
"""
from player import HumanPlayer, AIPlayer
from texas_holdem import TexasHoldem


def main():
    """ゲームのメイン処理"""
    print("=" * 50)
    print("テキサスホールデム ポーカーゲームへようこそ！")
    print("=" * 50)

    # プレイヤー名を入力
    player_name = input("\nあなたの名前を入力してください: ").strip()
    if not player_name:
        player_name = "あなた"

    # プレイヤーを作成
    players = [
        HumanPlayer(player_name, chips=1000),
        AIPlayer("AI_1", chips=1000, aggression=0.3),
        AIPlayer("AI_2", chips=1000, aggression=0.5),
        AIPlayer("AI_3", chips=1000, aggression=0.7),
    ]

    # ゲームを作成
    game = TexasHoldem(players, small_blind=10, big_blind=20)

    print(f"\n{len(players)}人でゲームを開始します")
    print("初期チップ: 1000")
    print("スモールブラインド: 10")
    print("ビッグブラインド: 20")

    # ゲームループ
    hand_count = 0
    while len(game.players) > 1:
        hand_count += 1
        print(f"\n\n{'#' * 50}")
        print(f"ハンド #{hand_count}")
        print(f"{'#' * 50}")

        try:
            # 1ハンドをプレイ
            game.play_hand()

            # チップ数を表示
            game.show_chip_counts()

            # 破産したプレイヤーを排除
            game.eliminate_broke_players()

            # ゲーム終了条件チェック
            if len(game.players) <= 1:
                break

            # 続けるか確認
            if isinstance(game.players[0], HumanPlayer):
                continue_game = input("\n次のハンドに進みますか？ (y/n): ").lower().strip()
                if continue_game != 'y':
                    print("ゲームを終了します")
                    break

        except KeyboardInterrupt:
            print("\n\nゲームを中断しました")
            break
        except Exception as e:
            print(f"\nエラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            break

    # 最終結果
    print("\n" + "=" * 50)
    print("ゲーム終了")
    print("=" * 50)

    if len(game.players) == 1:
        winner = game.players[0]
        print(f"\n優勝: {winner.name}")
        print(f"最終チップ: {winner.chips}")
    else:
        print("\n最終チップ:")
        sorted_players = sorted(game.players, key=lambda p: p.chips, reverse=True)
        for i, player in enumerate(sorted_players, 1):
            print(f"  {i}位: {player.name} - {player.chips}チップ")

    print("\nゲームをプレイしていただきありがとうございました！")


if __name__ == "__main__":
    main()
