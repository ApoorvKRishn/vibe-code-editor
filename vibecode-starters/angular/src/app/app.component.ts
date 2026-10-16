import { Component, signal } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <main class="container">
      <h1>Angular</h1>
      <p>Edit <code>src/app/app.component.ts</code>, save, and watch the preview update.</p>
      <button (click)="increment()">Count is {{ count() }}</button>
    </main>
  `,
})
export class AppComponent {
  count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }
}
