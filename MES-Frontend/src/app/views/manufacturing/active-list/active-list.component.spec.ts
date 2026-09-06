import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActiveListComponent } from './active-list.component';

describe('ActiveListComponent', () => {
  let component: ActiveListComponent;
  let fixture: ComponentFixture<ActiveListComponent>;

  beforeEach(() => {
    sessionStorage.setItem(
      'user',
      JSON.stringify({ id: 1, username: 'test.operator' }),
    );
    window.history.replaceState(
      { selectedItem: { companyId: 'COMP01' } },
      '',
      '/',
    );
  });

  afterEach(() => {
    sessionStorage.removeItem('user');
    window.history.replaceState(null, '', '/');
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
