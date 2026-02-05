import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenVault } from './open-vault';

describe('OpenVault', () => {
  let component: OpenVault;
  let fixture: ComponentFixture<OpenVault>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenVault]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenVault);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
