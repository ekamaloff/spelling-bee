import {Injectable} from "@angular/core";
import {CookieService} from "ngx-cookie-service";
import {HttpClient} from "@angular/common/http";
import { environment } from '../environments/environment';

export class Model {
  id: number;
  chars: string[];
  centerChar: string;
  validWords: string[];
  maxPoints: number;

  constructor() {
    this.id = 1;
    this.chars = ['u', 'i', 'n', 'g', 'a', 'l'];
    this.centerChar = 'b';
    this.validWords = ['bang', 'banging', 'bing', 'bail', 'bailing', 'bling', 'bain', 'glib'];
    this.maxPoints = this.validWords.map(w => this.calculatePoints(w)).reduce((a, b) => a + b, 0);
  }

  calculatePoints(word: string): number {
    let points = word.length > 4 ? word.length : 1;
    for (const char of this.chars) {
      if (!word.includes(char)) {
        return points;
      }
    }
    return points + 7; // bonus points for pangram
  }
}

export class LEVEL {
  static readonly 0 = { points: 0, name: "Beginner" };
  static readonly 1 = { points: 6, name: "Good Start" };
  static readonly 2 = { points: 14, name: "Moving Up" };
  static readonly 3 = { points: 23, name: "Good" };
  static readonly 4 = { points: 42, name: "Solid" };
  static readonly 5 = { points: 71, name: "Nice" };
  static readonly 6 = { points: 113, name: "Great" };
  static readonly 7 = { points: 141, name: "Amazing" };
  static readonly 8 = { points: 197, name: "Genius" };
}

export interface GameState {
  chars: string[];
  centerChar: string;
  inputWords: string[];
  points: number;
}

@Injectable(
  {providedIn: "root"}
)
export class GameService {
  model: Model;
  inputWords: string[];
  points: number;
  level: number;
  yesterdayId: number;
  yesterdayAnswers: string[];

  constructor(private http: HttpClient, private cookieService: CookieService) {
    this.reset();
  }

  async request(method: string, url: string, data?: any) {
    const result = this.http.request(method, url, {
      body: data,
      responseType: 'json',
      observe: 'body',
      headers: {
      }
    });
    return new Promise((resolve, reject) => {
      result.subscribe(resolve, reject);
    })
  }

  reset() {
    this.model = new Model();
    this.points = 0;
    this.level = 0;
    this.inputWords = [];
  }

  loadChallenge() {
    const requestChallenge = (resolve, reject) => {
      let today = new Date();
      let yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      this.request('GET', `${environment.serverUrl}/challenges/${today.toISOString().slice(0, 10)}`).then((response: any) => {
        console.log("Today's challenge", response[0]);
        this.model.id = response[0].challenge_id;
        this.model.chars = response[0].letters.slice(1).split('');
        this.model.centerChar = response[0].letters.slice(0, 1);
        this.model.validWords = response[0].words.split(',');
        this.model.maxPoints = this.model.validWords.map(w => this.model.calculatePoints(w)).reduce((a, b) => a + b, 0);
        this.loadState();
        resolve(this.model);
      }).catch((reason) => {
        console.error(`Error loading challenge: ${reason}`);
        reject();
      });
      this.request('GET', `${environment.serverUrl}/challenges/${yesterday.toISOString().slice(0, 10)}`).then((response: any) => {
        console.log("Yesterday's challenge", response[0]);
        this.yesterdayId = response[0].challenge_id;
        this.yesterdayAnswers = response[0].words.split(',').map(w => this.capitalize(w));
        this.yesterdayAnswers.sort();
      });
    }
    return new Promise(requestChallenge);
  }

  loadState() {
    let cookie = this.cookieService.get('game-state');
    if (!cookie) {
      console.log('cookie not found');
      return
    }
    let state: GameState = JSON.parse(cookie)
    let modelChars = Object.assign([], this.model.chars);
    modelChars.sort();
    state.chars.sort();
    if (modelChars.join('') !== state.chars.join('') || this.model.centerChar !== state.centerChar) {
      console.log('1: ' + (modelChars !== state.chars));
      console.log('2: ' + (this.model.centerChar !== state.centerChar));
      console.log('modelChars: ' + modelChars + ', state.chars: ' + state.chars + ', modelCenterChar: ' + this.model.centerChar + ', state.centerChar: ' + state.centerChar + ' removing cookie...')
      let yday = new Date()
      yday.setDate(yday.getDate() - 1)
      this.cookieService.set('game-state', '', yday);
      return;
    }

    this.inputWords = state.inputWords;
    this.points = state.points;
    this.level = 0;
    while (LEVEL[this.level + 1].points <= this.points) {
      this.level += 1;
    }
    console.log('loaded state: inputWords=' + this.inputWords + ', points=' + this.points);
  }

  saveState() {
    let state: GameState = {
      chars: this.model.chars,
      centerChar: this.model.centerChar,
      inputWords: this.inputWords,
      points: this.points
    }
    let expireDate = new Date()
    expireDate.setHours(23, 59, 59);
    this.cookieService.set('game-state', JSON.stringify(state), { expires: expireDate });
    console.log('saved state: ' + JSON.stringify(state));
  }

  capitalize(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
  }

  submitWord(word: string): string {
    word = word.toLowerCase();
    if (this.inputWords.includes(this.capitalize(word))) {
      return 'Already found';
    }
    if (word.length < 4) {
      return 'Too short!';
    }
    if (!word.includes(this.model.centerChar)) {
      return 'Must include letter ' + this.model.centerChar.toUpperCase();
    }
    if (!this.model.validWords.includes(word)) {
      console.log(word + ' is not part of ' + this.model.validWords);
      return 'Not a valid word';
    }
    this.inputWords.push(this.capitalize(word));
    this.points += this.model.calculatePoints(word);
    while (LEVEL[this.level + 1].points <= this.points) {
      this.level += 1;
    }
    this.saveState();
    return 'Well done!'
  }

  shuffle() {
    let currentIndex = this.model.chars.length, randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [this.model.chars[currentIndex], this.model.chars[randomIndex]] = [
        this.model.chars[randomIndex], this.model.chars[currentIndex]
      ];
    }
  }

  getProgress() {
    return this.model.maxPoints ? this.points / this.model.maxPoints : 0;
  }

  getLevelName() {
    console.log('level: ' + this.level);
    return LEVEL[this.level].name;
  }
}
