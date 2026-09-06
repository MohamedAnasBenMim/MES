import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiServiceCompleteOperation } from './api-report-operation.service';

describe('ApiService', () => {
  let service: ApiServiceCompleteOperation;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiServiceCompleteOperation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
