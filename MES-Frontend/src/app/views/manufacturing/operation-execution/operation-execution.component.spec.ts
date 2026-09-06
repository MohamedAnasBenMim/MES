import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OperationExecutionComponent } from './operation-execution.component';

describe('OperationExecutionComponent', () => {
  let component: OperationExecutionComponent;
  let fixture: ComponentFixture<OperationExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationExecutionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
