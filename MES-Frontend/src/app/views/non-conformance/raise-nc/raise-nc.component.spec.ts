import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaiseNcComponent } from './raise-nc.component';

describe('RaiseNcComponent', () => {
  let component: RaiseNcComponent;
  let fixture: ComponentFixture<RaiseNcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaiseNcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaiseNcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
