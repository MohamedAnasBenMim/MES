import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MaterialConsumptionPopupComponent } from './material-popup.component';

describe('MaterialPopupComponent', () => {
  let component: MaterialConsumptionPopupComponent;
  let fixture: ComponentFixture<MaterialConsumptionPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialConsumptionPopupComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialConsumptionPopupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
