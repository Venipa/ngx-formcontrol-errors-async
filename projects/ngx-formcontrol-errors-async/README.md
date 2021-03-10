# AsyncFormControlErrors

Handle your form control errors like a champ.   
Async is the way!!!

# Example
```typescript
import { Component, OnInit } from "@angular/core";
@prepareFormErrorObservables()
@Component({
  selector: "app-test-async-controls",
  template: `
    <form [formGroup]="group">
      <mat-form-field>
        <input matInput formControlName="name" type="text" />
        <mat-error *ngIf="getErrorObservable('name') | async as error">
          {{ error.content | translate }}
        </mat-error>
      </mat-form-field>
      <mat-form-field>
        <input matInput formControlName="description" type="text" />
        <mat-error *ngIf="getErrorObservable('description') | async as error">
          {{ error.content | translate }}
        </mat-error>
      </mat-form-field>
    </form>
  `,
})
export class TestAsyncControlsComponent implements OnInit {
  group = new FormGroup({
    name: new FormControl("", [Validators.required, Validators.minLength(3)]),
    description: new FormControl("", [
      Validators.required,
      Validators.maxLength(255),
    ]),
  });
  constructor() {}

  ngOnInit(): void {}
  getErrorObservable(controlName: string) {
    return useFormErrorObservable(this)(
      controlName,
      () => this.group.controls[controlName],
      {
        required: (error, ctrl) => ({
          content: `The ${controlName} field is required`,
        }),
        minLength: (error, ctrl) => ({
          content: `The ${controlName} must be greater than or equal ${error.requiredLength} characters.`,
        }),
        maxLength: (error, ctrl) => ({
          content: `The ${controlName} must be less than ${error.requiredLength} characters`,
        }),
      }
    );
  }
}
```
