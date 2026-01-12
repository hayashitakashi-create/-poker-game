// カードのスートとランク
const SUITS = {
    HEARTS: { symbol: '♥', name: 'hearts' },
    DIAMONDS: { symbol: '♦', name: 'diamonds' },
    CLUBS: { symbol: '♣', name: 'clubs' },
    SPADES: { symbol: '♠', name: 'spades' }
};

const RANKS = {
    TWO: { value: 2, display: '2' },
    THREE: { value: 3, display: '3' },
    FOUR: { value: 4, display: '4' },
    FIVE: { value: 5, display: '5' },
    SIX: { value: 6, display: '6' },
    SEVEN: { value: 7, display: '7' },
    EIGHT: { value: 8, display: '8' },
    NINE: { value: 9, display: '9' },
    TEN: { value: 10, display: '10' },
    JACK: { value: 11, display: 'J' },
    QUEEN: { value: 12, display: 'Q' },
    KING: { value: 13, display: 'K' },
    ACE: { value: 14, display: 'A' }
};

// 役のランク
const HAND_RANKS = {
    HIGH_CARD: { value: 1, display: 'ハイカード' },
    ONE_PAIR: { value: 2, display: 'ワンペア' },
    TWO_PAIR: { value: 3, display: 'ツーペア' },
    THREE_OF_A_KIND: { value: 4, display: 'スリーカード' },
    STRAIGHT: { value: 5, display: 'ストレート' },
    FLUSH: { value: 6, display: 'フラッシュ' },
    FULL_HOUSE: { value: 7, display: 'フルハウス' },
    FOUR_OF_A_KIND: { value: 8, display: 'フォーカード' },
    STRAIGHT_FLUSH: { value: 9, display: 'ストレートフラッシュ' },
    ROYAL_FLUSH: { value: 10, display: 'ロイヤルフラッシュ' }
};

// カードクラス
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    toString() {
        return `${this.suit.symbol}${this.rank.display}`;
    }
}

// デッキクラス
class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let suit of Object.values(SUITS)) {
            for (let rank of Object.values(RANKS)) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}

// プレイヤークラス
class Player {
    constructor(name, chips, isHuman = false) {
        this.name = name;
        this.chips = chips;
        this.hand = [];
        this.currentBet = 0;
        this.folded = false;
        this.allIn = false;
        this.isHuman = isHuman;
        this.aggression = Math.random() * 0.5 + 0.3; // 0.3 ~ 0.8
    }

    receiveCards(cards) {
        this.hand = cards;
    }

    bet(amount) {
        if (amount > this.chips) {
            const actualBet = this.chips;
            this.chips = 0;
            this.allIn = true;
            this.currentBet += actualBet;
            return actualBet;
        } else {
            this.chips -= amount;
            this.currentBet += amount;
            return amount;
        }
    }

    fold() {
        this.folded = true;
    }

    resetForNewHand() {
        this.hand = [];
        this.currentBet = 0;
        this.folded = false;
        this.allIn = false;
    }

    canAct() {
        return !this.folded && !this.allIn;
    }

    // AI判断
    decideAction(currentBet, minRaise, pot) {
        const toCall = currentBet - this.currentBet;
        const decision = Math.random();

        if (toCall === 0) {
            if (decision < 0.7) {
                return { action: 'check', amount: 0 };
            } else if (decision < 0.85) {
                const raiseAmount = Math.min(
                    minRaise + Math.floor(Math.random() * minRaise * 2),
                    this.chips
                );
                return { action: 'raise', amount: raiseAmount };
            } else {
                return { action: 'check', amount: 0 };
            }
        } else {
            if (toCall > this.chips * 0.3) {
                if (decision < 0.4 * (1 - this.aggression)) {
                    return { action: 'fold', amount: 0 };
                } else if (decision < 0.7) {
                    return { action: 'call', amount: toCall };
                } else {
                    if (this.chips > toCall + minRaise) {
                        const raiseAmount = Math.min(
                            minRaise + Math.floor(Math.random() * minRaise),
                            this.chips - toCall
                        );
                        return { action: 'raise', amount: raiseAmount };
                    } else {
                        return { action: 'call', amount: toCall };
                    }
                }
            } else {
                if (decision < 0.2) {
                    return { action: 'fold', amount: 0 };
                } else if (decision < 0.6 + this.aggression * 0.2) {
                    return { action: 'call', amount: toCall };
                } else {
                    if (this.chips > toCall + minRaise) {
                        const raiseAmount = Math.min(
                            minRaise + Math.floor(Math.random() * minRaise * 2),
                            this.chips - toCall
                        );
                        return { action: 'raise', amount: raiseAmount };
                    } else {
                        return { action: 'call', amount: toCall };
                    }
                }
            }
        }
    }
}

// 役判定クラス
class HandEvaluator {
    static evaluate(cards) {
        if (cards.length !== 7) {
            throw new Error('カードは7枚必要です');
        }

        let bestRank = HAND_RANKS.HIGH_CARD;
        let bestKickers = [];

        // すべての5枚の組み合わせを評価
        const combinations = this.getCombinations(cards, 5);
        for (let combo of combinations) {
            const [rank, kickers] = this.evaluateFiveCards(combo);
            if (rank.value > bestRank.value ||
                (rank.value === bestRank.value && this.compareKickers(kickers, bestKickers) > 0)) {
                bestRank = rank;
                bestKickers = kickers;
            }
        }

        return [bestRank, bestKickers];
    }

    static getCombinations(arr, size) {
        if (size > arr.length) return [];
        if (size === arr.length) return [arr];
        if (size === 1) return arr.map(el => [el]);

        const combos = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombos = this.getCombinations(arr.slice(i + 1), size - 1);
            for (let tail of tailCombos) {
                combos.push([head, ...tail]);
            }
        }
        return combos;
    }

    static evaluateFiveCards(cards) {
        const sortedCards = [...cards].sort((a, b) => b.rank.value - a.rank.value);
        const ranks = sortedCards.map(c => c.rank.value);
        const suits = sortedCards.map(c => c.suit.name);

        const isFlush = new Set(suits).size === 1;
        let isStraight = this.isStraight(ranks);

        // A-2-3-4-5のストレート（ホイール）
        const isWheel = JSON.stringify(ranks) === JSON.stringify([14, 5, 4, 3, 2]);
        if (isWheel) {
            isStraight = true;
        }

        // ランクの出現回数をカウント
        const rankCounts = {};
        for (let rank of ranks) {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        }

        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const uniqueRanks = Object.keys(rankCounts)
            .map(Number)
            .sort((a, b) => {
                if (rankCounts[b] !== rankCounts[a]) {
                    return rankCounts[b] - rankCounts[a];
                }
                return b - a;
            });

        // ロイヤルフラッシュ
        if (isFlush && isStraight && ranks[0] === 14 && !isWheel) {
            return [HAND_RANKS.ROYAL_FLUSH, ranks];
        }

        // ストレートフラッシュ
        if (isFlush && isStraight) {
            return [HAND_RANKS.STRAIGHT_FLUSH, isWheel ? [5, 4, 3, 2, 1] : ranks];
        }

        // フォーカード
        if (JSON.stringify(counts) === JSON.stringify([4, 1])) {
            return [HAND_RANKS.FOUR_OF_A_KIND, uniqueRanks];
        }

        // フルハウス
        if (JSON.stringify(counts) === JSON.stringify([3, 2])) {
            return [HAND_RANKS.FULL_HOUSE, uniqueRanks];
        }

        // フラッシュ
        if (isFlush) {
            return [HAND_RANKS.FLUSH, ranks];
        }

        // ストレート
        if (isStraight) {
            return [HAND_RANKS.STRAIGHT, isWheel ? [5, 4, 3, 2, 1] : ranks];
        }

        // スリーカード
        if (JSON.stringify(counts) === JSON.stringify([3, 1, 1])) {
            return [HAND_RANKS.THREE_OF_A_KIND, uniqueRanks];
        }

        // ツーペア
        if (JSON.stringify(counts) === JSON.stringify([2, 2, 1])) {
            return [HAND_RANKS.TWO_PAIR, uniqueRanks];
        }

        // ワンペア
        if (JSON.stringify(counts) === JSON.stringify([2, 1, 1, 1])) {
            return [HAND_RANKS.ONE_PAIR, uniqueRanks];
        }

        // ハイカード
        return [HAND_RANKS.HIGH_CARD, ranks];
    }

    static isStraight(ranks) {
        if (ranks.length !== 5) return false;
        const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
        if (uniqueRanks.length !== 5) return false;

        // 通常のストレート
        if (uniqueRanks[0] - uniqueRanks[4] === 4) return true;

        // A-2-3-4-5のストレート
        if (JSON.stringify(uniqueRanks) === JSON.stringify([14, 5, 4, 3, 2])) return true;

        return false;
    }

    static compareKickers(kickers1, kickers2) {
        for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
            if (kickers1[i] > kickers2[i]) return 1;
            if (kickers1[i] < kickers2[i]) return -1;
        }
        return 0;
    }

    static compareHands(hand1, hand2) {
        const [rank1, kickers1] = hand1;
        const [rank2, kickers2] = hand2;

        if (rank1.value > rank2.value) return 1;
        if (rank1.value < rank2.value) return -1;
        return this.compareKickers(kickers1, kickers2);
    }
}

// ゲームクラス
class TexasHoldem {
    constructor() {
        this.players = [];
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerPosition = 0;
        this.currentPlayerIndex = 0;
        this.stage = '';
        this.humanPlayer = null;
        this.waitingForHumanAction = false;
    }

    initialize(playerName, startingChips) {
        this.players = [
            new Player(playerName, startingChips, true),
            new Player('AI_1', startingChips),
            new Player('AI_2', startingChips),
            new Player('AI_3', startingChips)
        ];
        this.humanPlayer = this.players[0];
    }

    async playHand() {
        this.log('新しいハンドを開始します', true);

        // リセット
        this.players.forEach(p => p.resetForNewHand());
        this.deck.reset();
        this.deck.shuffle();
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;

        // ブラインド
        this.postBlinds();
        this.updateUI();

        // ホールカード配布
        this.dealHoleCards();
        this.updateUI();

        // プリフロップ
        this.stage = 'プリフロップ';
        this.updateUI();
        if (!await this.bettingRound()) {
            await this.showWinner();
            return;
        }

        // フロップ
        this.stage = 'フロップ';
        for (let i = 0; i < 3; i++) {
            this.communityCards.push(this.deck.draw());
        }
        this.updateUI();
        if (!await this.bettingRound()) {
            await this.showWinner();
            return;
        }

        // ターン
        this.stage = 'ターン';
        this.communityCards.push(this.deck.draw());
        this.updateUI();
        if (!await this.bettingRound()) {
            await this.showWinner();
            return;
        }

        // リバー
        this.stage = 'リバー';
        this.communityCards.push(this.deck.draw());
        this.updateUI();
        if (!await this.bettingRound()) {
            await this.showWinner();
            return;
        }

        // ショーダウン
        await this.showdown();

        // ディーラーボタン移動
        this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
    }

    postBlinds() {
        const sbPos = (this.dealerPosition + 1) % this.players.length;
        const bbPos = (this.dealerPosition + 2) % this.players.length;

        const sbPlayer = this.players[sbPos];
        const bbPlayer = this.players[bbPos];

        const sbAmount = sbPlayer.bet(this.smallBlind);
        const bbAmount = bbPlayer.bet(this.bigBlind);

        this.pot += sbAmount + bbAmount;
        this.currentBet = this.bigBlind;

        this.log(`${sbPlayer.name}がスモールブラインド${sbAmount}をベット`);
        this.log(`${bbPlayer.name}がビッグブラインド${bbAmount}をベット`);
    }

    dealHoleCards() {
        for (let player of this.players) {
            player.receiveCards([this.deck.draw(), this.deck.draw()]);
        }
    }

    async bettingRound() {
        const activePlayers = this.players.filter(p => p.canAct());
        if (activePlayers.length <= 1) return false;

        const startPos = (this.dealerPosition + 1) % this.players.length;
        let playerIndex = startPos;
        let actionsTaken = new Map(this.players.map(p => [p, false]));
        let lastRaiser = null;

        while (true) {
            const player = this.players[playerIndex];

            if (player.canAct()) {
                const allEqualBets = this.players.every(p =>
                    p.currentBet === this.currentBet || !p.canAct()
                );
                const allActed = Array.from(actionsTaken.entries()).every(([p, acted]) =>
                    acted || !p.canAct()
                );

                if (allEqualBets && allActed && lastRaiser !== player) {
                    break;
                }

                await this.playerAction(player);
                actionsTaken.set(player, true);

                if (player.currentBet > this.currentBet) {
                    lastRaiser = player;
                    this.currentBet = player.currentBet;
                }
            }

            playerIndex = (playerIndex + 1) % this.players.length;

            const stillActive = this.players.filter(p => p.canAct());
            if (stillActive.length <= 1) return false;
        }

        // ベットをリセット
        this.players.forEach(p => p.currentBet = 0);
        this.currentBet = 0;

        return true;
    }

    async playerAction(player) {
        this.currentPlayerIndex = this.players.indexOf(player);
        this.updateUI();

        const toCall = this.currentBet - player.currentBet;
        const minRaise = this.bigBlind;

        if (player.isHuman) {
            // 人間プレイヤーの入力待ち
            this.waitingForHumanAction = true;
            this.updatePlayerActions(toCall, minRaise);

            await new Promise(resolve => {
                this.resolveHumanAction = resolve;
            });
        } else {
            // AIの判断
            await this.sleep(1000);
            const decision = player.decideAction(this.currentBet, minRaise, this.pot);
            this.executeAction(player, decision.action, decision.amount, toCall);
        }

        this.updateUI();
    }

    executeAction(player, action, amount, toCall) {
        if (action === 'fold') {
            player.fold();
            this.log(`${player.name}はフォールドしました`);
        } else if (action === 'check') {
            this.log(`${player.name}はチェックしました`);
        } else if (action === 'call') {
            const actualAmount = player.bet(amount);
            this.pot += actualAmount;
            this.log(`${player.name}は${actualAmount}をコールしました`);
        } else if (action === 'raise') {
            const callAmount = player.bet(toCall);
            const raiseAmount = player.bet(amount);
            const total = callAmount + raiseAmount;
            this.pot += total;
            this.currentBet = player.currentBet;
            this.log(`${player.name}は${total}にレイズしました`, true);
        }
    }

    async showWinner() {
        const activePlayers = this.players.filter(p => !p.folded);

        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            winner.chips += this.pot;
            this.log(`${winner.name}が${this.pot}チップを獲得しました！`, true);

            await this.sleep(2000);
            this.checkGameOver();
        }
    }

    async showdown() {
        this.log('ショーダウン！', true);

        const activePlayers = this.players.filter(p => !p.folded);
        const playerHands = [];

        for (let player of activePlayers) {
            const allCards = [...player.hand, ...this.communityCards];
            const [handRank, kickers] = HandEvaluator.evaluate(allCards);
            playerHands.push({ player, handRank, kickers });
            this.log(`${player.name}: ${handRank.display}`);
        }

        // 勝者を決定
        playerHands.sort((a, b) => HandEvaluator.compareHands(
            [b.handRank, b.kickers],
            [a.handRank, a.kickers]
        ));

        const winners = [playerHands[0]];
        for (let i = 1; i < playerHands.length; i++) {
            const result = HandEvaluator.compareHands(
                [playerHands[0].handRank, playerHands[0].kickers],
                [playerHands[i].handRank, playerHands[i].kickers]
            );
            if (result === 0) {
                winners.push(playerHands[i]);
            } else {
                break;
            }
        }

        // ポット分配
        const winnings = Math.floor(this.pot / winners.length);
        this.log('勝者:', true);
        for (let { player, handRank } of winners) {
            player.chips += winnings;
            this.log(`  ${player.name} - ${handRank.display} (+${winnings}チップ)`);
        }

        // 結果画面を表示
        this.showResultScreen(winners, playerHands);
    }

    showResultScreen(winners, allHands) {
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = '';

        for (let { player, handRank, kickers } of allHands) {
            const isWinner = winners.some(w => w.player === player);
            const div = document.createElement('div');
            div.className = `result-player ${isWinner ? 'winner' : ''}`;
            div.innerHTML = `
                <h3>${player.name} ${isWinner ? '🏆' : ''}</h3>
                <div>手札: ${player.hand.map(c => c.toString()).join(' ')}</div>
                <div>役: ${handRank.display}</div>
                <div>チップ: ${player.chips}</div>
            `;
            resultContent.appendChild(div);
        }

        this.showScreen('result-screen');
    }

    checkGameOver() {
        const remainingPlayers = this.players.filter(p => p.chips > 0);

        if (remainingPlayers.length === 1) {
            this.showGameOver(remainingPlayers[0]);
            return true;
        }

        // 破産したプレイヤーを除外
        const broke = this.players.filter(p => p.chips <= 0);
        for (let player of broke) {
            this.log(`${player.name}はチップが無くなり、ゲームから脱落しました`, true);
        }
        this.players = remainingPlayers;

        return false;
    }

    showGameOver(winner) {
        const content = document.getElementById('game-over-content');
        content.innerHTML = `
            <h3>優勝: ${winner.name} 🏆</h3>
            <p>最終チップ: ${winner.chips}</p>
            <p>おめでとうございます！</p>
        `;
        this.showScreen('game-over-screen');
    }

    updateUI() {
        // ポットと現在のベット
        document.getElementById('pot').textContent = this.pot;
        document.getElementById('current-bet').textContent = this.currentBet;

        // ゲームステージ
        document.getElementById('game-stage').textContent = this.stage;

        // コミュニティカード
        const communityCardsEl = document.getElementById('community-cards');
        communityCardsEl.innerHTML = '';
        for (let card of this.communityCards) {
            const cardEl = this.createCardElement(card);
            communityCardsEl.appendChild(cardEl);
        }

        // 人間プレイヤー
        const humanPlayer = this.humanPlayer;
        document.getElementById('player-name-display').textContent = humanPlayer.name;
        document.getElementById('player-chips').textContent = humanPlayer.chips;
        document.getElementById('player-bet').textContent = humanPlayer.currentBet;

        const playerCardsEl = document.getElementById('player-cards');
        playerCardsEl.innerHTML = '';
        for (let card of humanPlayer.hand) {
            const cardEl = this.createCardElement(card);
            playerCardsEl.appendChild(cardEl);
        }

        // 役の表示
        if (humanPlayer.hand.length === 2 && this.communityCards.length >= 3) {
            const allCards = [...humanPlayer.hand, ...this.communityCards];
            const [handRank] = HandEvaluator.evaluate(allCards);
            document.getElementById('player-hand-rank').textContent = handRank.display;
        } else {
            document.getElementById('player-hand-rank').textContent = '';
        }

        // ステータス
        let status = '';
        if (humanPlayer.folded) status = 'フォールド';
        else if (humanPlayer.allIn) status = 'オールイン';
        document.getElementById('player-status').textContent = status;

        // AIプレイヤー
        const aiPlayersEl = document.getElementById('ai-players');
        aiPlayersEl.innerHTML = '';
        for (let i = 1; i < this.players.length; i++) {
            const player = this.players[i];
            const isActive = this.players[this.currentPlayerIndex] === player;
            const div = document.createElement('div');
            div.className = `ai-player ${isActive ? 'active' : ''} ${player.folded ? 'folded' : ''}`;

            let status = '';
            if (player.folded) status = 'フォールド';
            else if (player.allIn) status = 'オールイン';

            div.innerHTML = `
                <h4>${player.name}</h4>
                <div class="chips">チップ: ${player.chips}</div>
                <div class="player-bet">ベット: ${player.currentBet}</div>
                <div class="player-status">${status}</div>
                <div class="cards-container">
                    ${player.hand.map(() => '<div class="card-back">?</div>').join('')}
                </div>
            `;
            aiPlayersEl.appendChild(div);
        }
    }

    createCardElement(card) {
        const div = document.createElement('div');
        div.className = `card ${card.suit.name}`;
        div.textContent = card.toString();
        return div;
    }

    updatePlayerActions(toCall, minRaise) {
        const foldBtn = document.getElementById('fold-btn');
        const checkBtn = document.getElementById('check-btn');
        const callBtn = document.getElementById('call-btn');
        const raiseBtn = document.getElementById('raise-btn');
        const raiseInput = document.getElementById('raise-amount');

        // 全てのボタンを有効化
        foldBtn.disabled = false;
        checkBtn.disabled = false;
        callBtn.disabled = false;
        raiseBtn.disabled = false;
        raiseInput.disabled = false;

        document.getElementById('call-amount').textContent = toCall;

        if (toCall === 0) {
            checkBtn.style.display = 'inline-flex';
            callBtn.style.display = 'none';
        } else {
            checkBtn.style.display = 'none';
            callBtn.style.display = 'inline-flex';
        }

        raiseInput.min = minRaise;
        raiseInput.value = minRaise;
    }

    disablePlayerActions() {
        // 全てのボタンを無効化
        document.getElementById('fold-btn').disabled = true;
        document.getElementById('check-btn').disabled = true;
        document.getElementById('call-btn').disabled = true;
        document.getElementById('raise-btn').disabled = true;
        document.getElementById('raise-amount').disabled = true;
    }

    log(message, important = false) {
        const logEl = document.getElementById('message-log');
        const div = document.createElement('div');
        div.className = `log-message ${important ? 'important' : ''}`;
        div.textContent = message;
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// グローバルゲームインスタンス
let game = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // スタートボタン
    document.getElementById('start-game-btn').addEventListener('click', () => {
        const playerName = document.getElementById('player-name').value.trim() || 'プレイヤー';
        const startingChips = parseInt(document.getElementById('starting-chips').value);

        game = new TexasHoldem();
        game.initialize(playerName, startingChips);
        game.showScreen('game-screen');
        game.playHand();
    });

    // アクションボタン
    document.getElementById('fold-btn').addEventListener('click', () => {
        if (game && game.waitingForHumanAction) {
            game.disablePlayerActions();
            game.waitingForHumanAction = false;
            game.executeAction(game.humanPlayer, 'fold', 0, 0);
            game.resolveHumanAction();
        }
    });

    document.getElementById('check-btn').addEventListener('click', () => {
        if (game && game.waitingForHumanAction) {
            game.disablePlayerActions();
            game.waitingForHumanAction = false;
            game.executeAction(game.humanPlayer, 'check', 0, 0);
            game.resolveHumanAction();
        }
    });

    document.getElementById('call-btn').addEventListener('click', () => {
        if (game && game.waitingForHumanAction) {
            game.disablePlayerActions();
            const toCall = game.currentBet - game.humanPlayer.currentBet;
            game.waitingForHumanAction = false;
            game.executeAction(game.humanPlayer, 'call', toCall, toCall);
            game.resolveHumanAction();
        }
    });

    document.getElementById('raise-btn').addEventListener('click', () => {
        if (game && game.waitingForHumanAction) {
            game.disablePlayerActions();
            const raiseAmount = parseInt(document.getElementById('raise-amount').value);
            const toCall = game.currentBet - game.humanPlayer.currentBet;
            game.waitingForHumanAction = false;
            game.executeAction(game.humanPlayer, 'raise', raiseAmount, toCall);
            game.resolveHumanAction();
        }
    });

    // 次のハンドボタン
    document.getElementById('next-hand-btn').addEventListener('click', () => {
        if (game && !game.checkGameOver()) {
            game.showScreen('game-screen');
            game.playHand();
        }
    });

    // ゲーム終了ボタン
    document.getElementById('quit-game-btn').addEventListener('click', () => {
        game.showScreen('start-screen');
        game = null;
    });

    // リスタートボタン
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        game.showScreen('start-screen');
        game = null;
    });
});
