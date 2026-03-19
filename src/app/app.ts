import { Component } from '@angular/core';
import { OpenVault } from './features/open-vault/open-vault';
import { HelpTutorialButton } from './features/help-tutorial-button/help-tutorial-button';

@Component({
  selector: 'app-root',
  imports: [OpenVault, HelpTutorialButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'vault-dels-secrets';
}
