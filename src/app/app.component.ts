import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {GameService} from "./game.service";
import {ToastService} from "./toast-service";
import {WindowRef} from "./window-ref.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'spelling-bee';
  @ViewChild('progressBar', { static: true })
  progressBar: ElementRef<HTMLDivElement>
  @ViewChild('liveToast', { static: true })
  liveToast: ElementRef<HTMLDivElement>
  dropDownExpanded: boolean
  dropDownText: string

  constructor(public gameService: GameService, private toastService: ToastService, private windowRef: WindowRef) {
  }

  shuffle() {
    this.gameService.shuffle();
    console.log('shuffled: ' + this.gameService.model.chars);
  }

  addLetter(input: HTMLInputElement, c: string) {
    let val = input.value
    if (!val) {
      val = ''
    }
    input.value = val + c
    input.focus();
    console.log('added letter: ' + c);
  }

  submitWord(word: string) {
    if (!word) {
      return
    }
    let msg = this.gameService.submitWord(word);
    if (msg) {
      this.toastService.show(msg);
    }
    this.updateDropDownText();
    console.log('input words: ' + this.gameService.inputWords + ', msg: ' + msg);
  }

  ngOnInit(): void {
    this.gameService.loadChallenge().then(() => {
      this.updateDropDownText();
    });
  }

  truncateString(s) {
    return s.length > 25 ? s.substring(0, 25-1) + '...' : s;
  }

  updateDropDownText() {
    this.dropDownText = this.gameService.inputWords.length === 0
      ? 'No words yet...'
      : this.truncateString(this.gameService.inputWords.join(' '));
  }

  share() {
    let document: Document = this.windowRef.nativeWindow.document;
    let navigator: Navigator = this.windowRef.nativeWindow.navigator;
    let msg =
      `🐝 Spelling Bee #${this.gameService.model.id}
${this.gameService.getLevelName()} | #P: ${this.gameService.points}/${this.gameService.model.maxPoints} | #W: ${this.gameService.inputWords.length}/${this.gameService.model.validWords.length}
https://sbee.eldark.co.uk`;

    if (navigator.canShare()) {
      navigator.share({ title: document.title, url: document.location.href, text: msg });
    } else {
      const type = "text/plain";
      const blob = new Blob([msg], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      navigator.clipboard.write(data);
      this.toastService.show('Copied to clipboard');
      console.log("cannot share!");
    }
  }

}
