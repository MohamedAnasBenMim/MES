import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { NgScrollbar } from 'ngx-scrollbar';

import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems as allNavItems } from './_nav';
import { ICustomNavData } from './custom-nav';
import { UserApiService } from '../../services/user-get-API/api-user-get.service';
import { IdleTimeoutService } from '../../services/idle-timeout/idle-timeout.service';
import {
  clearAuthSession,
  getAuthItem,
  getAuthRole,
  getAuthUser,
  getAuthUserId,
  getAuthUsername,
} from '../../utils/auth-storage';
import { getDeviceId } from '../../utils/device-identity';

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.css'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective,
  ],
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public navItems: ICustomNavData[] = [];

  role = '';
  idleWarningVisible = false;
  idleRemainingSeconds = 180;
  isAutomaticLogoutRunning = false;

  private lastHeartbeatTimestamp = 0;
  private readonly heartbeatIntervalMilliseconds = 60 * 1000;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly userApiService: UserApiService,
    private readonly idleTimeoutService: IdleTimeoutService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.subscribeToIdleTimeoutEvents();

    const storedRole = this.normalizeRole(getAuthRole());
    const userId = getAuthUserId();

    if (storedRole) {
      this.role = storedRole;
      this.navItems = this.filterNavItemsByRole(allNavItems, storedRole);
      this.configureIdleTimeout(storedRole);
    }

    if (!userId) {
      console.warn('No user ID found in auth storage.');
      this.finishAutomaticLogout();
      return;
    }

    this.userApiService
      .getUserById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fullUser) => {
          const resolvedRole = this.normalizeRole(fullUser?.role || storedRole);
          this.role = resolvedRole;
          this.navItems = this.filterNavItemsByRole(allNavItems, resolvedRole);
          this.configureIdleTimeout(resolvedRole);
        },
        error: (error) => {
          console.error('Failed to fetch user data:', error);
          this.configureIdleTimeout(storedRole);
        },
      });
  }

  ngOnDestroy(): void {
    this.idleTimeoutService.stop();
  }

  continueSession(): void {
    this.idleTimeoutService.continueSession();
    this.sendHeartbeat(true);
  }

  get idleCountdownDisplay(): string {
    const minutes = Math.floor(this.idleRemainingSeconds / 60);
    const seconds = this.idleRemainingSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  filterNavItemsByRole(
    items: ICustomNavData[],
    role: string,
  ): ICustomNavData[] {
    return items
      .filter((item) => !item.roles || item.roles.includes(role))
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterNavItemsByRole(item.children as ICustomNavData[], role)
          : undefined,
      }));
  }

  private subscribeToIdleTimeoutEvents(): void {
    this.idleTimeoutService.warningVisible$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((visible) => {
        this.idleWarningVisible = visible;
      });

    this.idleTimeoutService.remainingSeconds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((seconds) => {
        this.idleRemainingSeconds = seconds;
      });

    this.idleTimeoutService.activity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sendHeartbeat(false);
      });

    this.idleTimeoutService.timedOut$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.performAutomaticLogout();
      });
  }

  private configureIdleTimeout(role: string): void {
    const normalizedRole = this.normalizeRole(role);

    if (!normalizedRole || normalizedRole === 'admin') {
      this.idleTimeoutService.stop();
      this.idleWarningVisible = false;
      return;
    }

    this.idleTimeoutService.start();
    this.sendHeartbeat(true);
  }

  private sendHeartbeat(force: boolean): void {
    if (this.role === 'admin') {
      return;
    }

    const now = Date.now();

    if (
      !force &&
      now - this.lastHeartbeatTimestamp < this.heartbeatIntervalMilliseconds
    ) {
      return;
    }

    const sessionId = getAuthItem('session_id');
    const username = getAuthUsername();

    if (!sessionId && !username) {
      return;
    }

    this.lastHeartbeatTimestamp = now;

    this.userApiService
      .heartbeatSession({
        session_id: sessionId || undefined,
        username: username || undefined,
        device_id: getDeviceId(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          console.error('Session heartbeat failed:', error);
        },
      });
  }

  private performAutomaticLogout(): void {
    if (this.isAutomaticLogoutRunning) {
      return;
    }

    if (this.role === 'admin') {
      this.idleTimeoutService.stop();
      return;
    }

    this.isAutomaticLogoutRunning = true;
    this.idleTimeoutService.stop();

    const sessionId = getAuthItem('session_id');
    const username = getAuthUsername() || getAuthUser()?.username || '';

    if (!sessionId && !username) {
      this.finishAutomaticLogout();
      return;
    }

    this.userApiService
      .logoutSession({
        session_id: sessionId || undefined,
        username: username || undefined,
      })
      .pipe(
        finalize(() => {
          this.finishAutomaticLogout();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error) => {
          console.error('Automatic session logout failed:', error);
        },
      });
  }

  private finishAutomaticLogout(): void {
    this.idleTimeoutService.stop();
    clearAuthSession();
    this.isAutomaticLogoutRunning = false;
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private normalizeRole(role: string): string {
    const normalizedRole = String(role || '')
      .replace(/^\/?/, '')
      .trim()
      .toLowerCase();

    if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') {
      return 'admin';
    }

    return normalizedRole;
  }
}
