import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NcPopupComponent } from './nc-popup.component';

describe('NcPopupComponent', () => {
  let component: NcPopupComponent;
  let fixture: ComponentFixture<NcPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NcPopupComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(NcPopupComponent);
    component = fixture.componentInstance;
    component.dataFromParent = {
      Order: 'J10000001',
      Operation: 10,
      item: 'ITEM-001',
      bomitem: 'BOM-001',
      OrderPosition: 1,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
