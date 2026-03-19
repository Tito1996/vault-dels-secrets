import { Component, HostListener, signal } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-help-tutorial-button',
  templateUrl: './help-tutorial-button.html',
  styleUrl: './help-tutorial-button.scss',
})
export class HelpTutorialButton {
  readonly isOpen = signal(false);

  openTutorial() {
    this.isOpen.set(true);
  }

  closeTutorial() {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen()) {
      this.closeTutorial();
    }
  }
}
