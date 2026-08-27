import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveListComponent } from './active-list.component';

describe('ActiveListComponent', () => {
  let component: ActiveListComponent;
  let fixture: ComponentFixture<ActiveListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
