import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUsersPopupComponent } from './add-users-popup.component';

describe('AddUsersPopupComponent', () => {
  let component: AddUsersPopupComponent;
  let fixture: ComponentFixture<AddUsersPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUsersPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUsersPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
