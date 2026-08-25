import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonConformanceComponent } from './non-conformance.component';

describe('NonConformanceComponent', () => {
  let component: NonConformanceComponent;
  let fixture: ComponentFixture<NonConformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonConformanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonConformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
