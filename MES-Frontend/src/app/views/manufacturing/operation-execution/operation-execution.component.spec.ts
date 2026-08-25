import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationExecutionComponent } from './operation-execution.component';

describe('OperationExecutionComponent', () => {
  let component: OperationExecutionComponent;
  let fixture: ComponentFixture<OperationExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationExecutionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
