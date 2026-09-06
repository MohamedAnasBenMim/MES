import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AttachmentApiService } from './api-nc-attachment-post.service';

describe('ApiService', () => {
  let service: AttachmentApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttachmentApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
