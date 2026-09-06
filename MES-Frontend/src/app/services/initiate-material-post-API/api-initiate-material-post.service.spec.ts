import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiInitiateMaterials } from './api-initiate-material.service';

describe('ApiService', () => {
  let service: ApiInitiateMaterials;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiInitiateMaterials);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
