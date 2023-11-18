// basically sets a type to see what type of state the game is in!
type GameState = 'MENU' | 'GAME' | 'WON' | 'LOSE';

const CARD_COUNT = 6; // the amount of cards in the grid

type Card = {
  hiddenValue:number; // the hidden value that will get matched
  isFliped:boolean; // if the hiddenValue is seen
  foundMatch:boolean; // if its already has a found match
}

const initGrid = (gameCanvas:HTMLElement) => {
  const girdDiv = document.createElement('div');
  girdDiv.className = 'card-box';
  gameCanvas.appendChild(girdDiv);
};

const statTypes = {
  win: 'Wins: ',
  moves: 'Moves Left: ',
  time: 'Passed Time: ',
};

const initStats = (statCanvas:HTMLElement) => {
  const moveDiv = document.createElement('div');
  const winDiv = document.createElement('div');
  const timeDiv = document.createElement('div');
  const moveWinDiv = document.createElement('div');

  // make movediv class
  moveDiv.className = 'stat-moves';
  moveDiv.textContent = statTypes.moves;
  // make winsdiv class
  winDiv.className = 'stat-wins';
  winDiv.textContent = statTypes.win;
  // make movediv class
  timeDiv.className = 'stat-time';
  timeDiv.textContent = statTypes.time;

  // moveWin div so they are in the same container
  moveWinDiv.className = 'win-moves-box';

  // Add the Stat divs to the statDiv
  moveWinDiv.appendChild(winDiv);
  moveWinDiv.appendChild(moveDiv);
  statCanvas.appendChild(moveWinDiv);
  statCanvas.appendChild(timeDiv);
};

class Game {
  private game = document.getElementById('game'); // get the main game probably shouldnt have it but eh, it works
  private state:GameState; // checks if the game is in Menu or ingame or has won.
  private moveAmount:number; // amount of movies till you lose.

  private cardArray: Card[] = []; // array that stores all the cards!
  private currentCard = 'NONE'; // current card that aka its id [ c-1 ] as example
  // a Set of numbers to check the cards, using a set just in case so it doesnt get filled.
  private selectedCards = new Set<number>();
  private points = 0; // Points / how many matches won!
  private passedTime = 0; // time that has passed
  // eslint-disable-next-line no-undef
  private timerId: NodeJS.Timeout | null = null;

  private gameWon = false; // boolean to check if the all cards match!

  // Store stats after winning / losing
  private fastestTime = 0;
  constructor() {
    this.state = 'MENU'; // set the state as in menu
    this.initMenu(); // create the menu / make the button and menu-box
  }

  initMenu() {
    const menuDiv = document.createElement('div'); // create a Div element where you can store a class menu-box
    menuDiv.className = 'menu-box'; // add the class to the div element

    const startButton = document.createElement('button'); // create a button element
    startButton.className = 'btn-start-game'; // add the btn-start-game to the button element
    startButton.innerText = 'Start Game'; // with the text Start Game
    startButton.onclick = this.startGame; // when its clicked init game

    menuDiv.appendChild(startButton); // add the button as its child to the menu
    this.game.appendChild(menuDiv); // and add the menu to the game div
  }

  shuffleCards(values: number[]): number[] {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1)); // random next intiger
      // eslint-disable-next-line no-param-reassign
      [values[i], values[j]] = [values[j], values[i]]; // value basically switches places;
    }
    return values; // returns the array of the shuffled list
  }

  initializeGame() {
    this.moveAmount = 10; // set moves
    this.cardArray = []; // clear the array
    this.passedTime = 0; // set the time to zero
    this.gameWon = false; // set the win checker to false

    this.game.classList.add('game-box-gui'); // so the game box is bigger

    const statDiv = document.createElement('div'); // make div
    statDiv.className = 'stat-box'; // add it where the stats will be saved showned at;
    initStats(statDiv); // init stat text
    this.game.appendChild(statDiv); // add it to the game container

    initGrid(this.game); // creates the css grid, where you can place the cards in
    const girdDiv = document.querySelector('.card-box'); // find the card-box / grid

    // shuffle the hidden numbers around so its a little bit random
    const shuffledValues = this.shuffleCards([1, 2, 3, 1, 2, 3]);

    for (let i = 1; i <= CARD_COUNT; i += 1) {
      // eslint-disable-next-line max-len
      this.cardArray.push({ hiddenValue: shuffledValues[i - 1], isFliped: true, foundMatch: false }); // creates the cards;
      const cardDiv = document.createElement('div'); // make div
      cardDiv.className = 'card-down'; // add a class to the div called card-down
      cardDiv.id = `c-${i}`; // sets the cards id to the index number
      girdDiv.appendChild(cardDiv); // add it as a child to the grid
    }

    this.startTime(); // start the time counter
  }

  startGame = () => {
    this.state = 'GAME'; // set the game state to GAME
    const menuBox = document.querySelector('.menu-box'); // get element
    const wonLoseBox = document.querySelector('.won-lose-box'); // get element
    if (menuBox) menuBox.remove(); // removes the menu
    if (wonLoseBox) wonLoseBox.remove(); // removes the menu

    this.initializeGame(); // initialize the game moves, shuffling etc..
  };

  startTime() {
    this.timerId = setInterval(() => {
      this.passedTime += 1;
    }, 1000);
  }
  stopTime() {
    // eh probably shouldnt be its own seprate functions.
    if (this.timerId) clearInterval(this.timerId); // clears the time interval
  }

  handleCardClick() {
    if (this.currentCard !== 'NONE' && this.selectedCards.size <= 1) {
      const card = document.getElementById(this.currentCard); // get the current card with the id

      // get the array id so we can get the array card data
      const id = parseInt(this.currentCard[this.currentCard.length - 1], 10) - 1;
      const cardData = this.cardArray[id]; // get card data

      if (cardData.isFliped !== false) {
        card.addEventListener('click', () => {
          console.log('CARD CLICKED:', cardData);
          cardData.isFliped = false; // set cards not to be fliped anymore
          this.selectedCards.add(id); // and add the index to the set, so that we can match
          if (this.currentCard !== 'NONE') {
            this.moveAmount -= 1;
            this.currentCard = 'NONE';
          };
        });
      }
      // checks if the cards can be now matched and see if they do or dont
    } else if (this.currentCard !== 'NONE') this.checkMatch();
  }

  checkMatch() {
    const [firstCard, secondCard] = [...this.selectedCards]; // get the card data indexes to match

    // if they match set it that they found a match
    if (this.cardArray[firstCard].hiddenValue === this.cardArray[secondCard].hiddenValue) {
      this.cardArray[firstCard].foundMatch = true;
      this.cardArray[secondCard].foundMatch = true;
    } else {
      // if they dont match flip them over
      this.cardArray[firstCard].isFliped = true;
      this.cardArray[secondCard].isFliped = true;
    }
    this.selectedCards.clear(); // clear the set afterwards so we can match new cards
  }

  checkWinState() {
    // checks if every card has a the same value aka boolean here and if does returns a boolean
    if (this.moveAmount <= 0) {
      this.state = 'LOSE'; // last the game becasue ran out of moves
    }
    const allMatch = this.cardArray.every((card) => card.foundMatch);
    if (allMatch && !this.gameWon) {
      this.stopTime(); // stops the timer
      this.points += 1; // add a point for winning
      this.gameWon = true; // set the game as won!
      this.state = 'WON'; // set the state as won
      console.log("YOU WON!");
    }

    if (this.state === 'LOSE' || this.state === 'WON') {
      this.game.classList.remove('game-box-gui'); // remove the game state gui box

      const children = [...this.game.childNodes]; // get all the children
      for (const child of children) this.game.removeChild(child); // remove all children

      const wonLoseDiv = document.createElement('div'); // create a new div
      wonLoseDiv.className = 'won-lose-box'; // set its class to win lose to render state

      const button = document.createElement('button');
      button.className = 'btn-start-game';
      button.onclick = this.startGame;
      button.textContent = `YOU ${this.state === 'WON' ? 'WON!' : 'LOST!'}`;
      wonLoseDiv.appendChild(button);

      this.game.appendChild(wonLoseDiv); // add it to the game container
      if (this.gameWon) {
        this.fastestTime = this.passedTime; // set it so can store it and maybe save it
      }
    }
  }

  update() {
    if (this.state === 'GAME') {
      for (let i = 0; i <= CARD_COUNT - 1; i += 1) {
        const cardId = i + 1; // make the card id

        const card = document.getElementById(`c-${cardId}`); // get the card with the id

        if (card !== undefined) {
          card.addEventListener('mouseover', () => {
            this.currentCard = `c-${cardId}`; // sets the currentCard id as the current card that its on!

            if (this.cardArray[i].isFliped && !this.cardArray[i].foundMatch) {
              card.animate( // makes a animation that moves the cards up and down
                { transform: ['translateY(0px)', 'translateY(-20px)', 'translateY(20px)', 'translateY(0px)'] },
                {
                  duration: 500, // set duration
                },
              );
            }
          }); // check if the mouse is over the card
        }
      }

      this.handleCardClick(); // check when the card is clicked upon
      this.checkWinState(); // check if you have won the game
      this.updateStats();
      this.draw(); // update drawing the cards
    } // tbh might be removed
  }

  updateStats() {
    // get the wins and moves divs so we can insert the stats of the game
    const win:HTMLElement | undefined = document.querySelector('.stat-wins');
    const moves = document.querySelector('.stat-moves');
    const time = document.querySelector('.stat-time');

    // apply the text content of the stats
    if (win) win.textContent = `${statTypes.win} ${this.points}`;
    if (moves) moves.textContent = `${statTypes.moves} ${this.moveAmount}`;
    if (time) time.textContent = `${statTypes.time} ${this.passedTime}s`;
  }

  draw() {
    for (let i = 0; i < CARD_COUNT; i += 1) {
      const cardId = i + 1; // get the cards id
      const card = document.getElementById(`c-${cardId}`); // get the card div by its id
      if (card) {
        const cardData = this.cardArray[i];

        if (!cardData.isFliped && !cardData.foundMatch && this.selectedCards.has(i)) {
          card.classList.add('card-flip');
          card.textContent = cardData.hiddenValue.toString();
        } else {
          card.classList.remove('card-flip');
          card.textContent = '';
        }

        if (cardData.foundMatch) {
          card.classList.add('card-flip');
          card.textContent = cardData.hiddenValue.toString();
        }
      }
    }
  }
}
const myGame = new Game(); // init game it self

// Idk i tried to limit the frame rate / update time, but idk doesnt seem to be working :C
const target = 30;
const delay = 1000 / target;

function gameLoop() {
  myGame.update();
  setTimeout(gameLoop, delay * 10);
}

// Start the game loop
gameLoop();
