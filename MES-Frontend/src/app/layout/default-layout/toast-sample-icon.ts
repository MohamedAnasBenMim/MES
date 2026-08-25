import { Component, Input } from '@angular/core';
@Component({
  selector: 'toast-sample-icon',
  template: `<svg
    class="rounded me-2"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
    role="img"
  >
    <rect width="100%" height="100%" [attr.fill]="color"></rect>
  </svg>`,
  standalone: true,
})
export class ToastSampleIconComponent {
  @Input() color: string = '#28a745'; // default green
}
