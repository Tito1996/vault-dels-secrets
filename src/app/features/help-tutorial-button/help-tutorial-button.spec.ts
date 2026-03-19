import { describe, expect, it } from 'vitest';

import { HelpTutorialButton } from './help-tutorial-button';

describe('HelpTutorialButton', () => {
  it('abre y cierra el tutorial', () => {
    const component = new HelpTutorialButton();

    component.openTutorial();
    expect(component.isOpen()).toBe(true);

    component.closeTutorial();
    expect(component.isOpen()).toBe(false);
  });

  it('cierra con escape cuando está abierto', () => {
    const component = new HelpTutorialButton();

    component.openTutorial();
    component.onEscapeKey();

    expect(component.isOpen()).toBe(false);
  });
});
