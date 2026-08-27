import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NcPopupComponent } from './nc-popup.component';

describe('NcPopupComponent', () => {
  let component: NcPopupComponent;
  let fixture: ComponentFixture<NcPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NcPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NcPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
