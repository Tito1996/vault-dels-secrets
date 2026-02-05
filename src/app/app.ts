import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OpenVault } from './features/open-vault/open-vault';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OpenVault],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'vault-dels-secrets';
}
