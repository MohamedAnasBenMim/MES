import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RaiseNcComponent } from './raise-nc.component';

describe('RaiseNcComponent', () => {
  let component: RaiseNcComponent;
  let fixture: ComponentFixture<RaiseNcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaiseNcComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RaiseNcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
