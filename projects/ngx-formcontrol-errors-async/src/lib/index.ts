import { ɵComponentType as ComponentType } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

const OBSERVABLE_FORM_ERROR_PROPNAME = {
  OBSERVABLE_STORE = '__formcontrol_observables',
  OBSERVABLE_KILL_NOTIFY = '__formcontrol_observableKill',
};
export function prepareFormErrorObservables(): ClassDecorator {
  return (_type: any) => {
    (<T>(type: ComponentType<T>): void => {
      type.prototype[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_STORE] = {};
      type.prototype[
        OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_KILL_NOTIFY
      ] = new Subject<void>();
      type.prototype.ngOnDestroy = (function (
        ngOnDestroy: (() => void) | null | undefined
      ) {
        return function (this: any) {
          ngOnDestroy && ngOnDestroy.call(this);
          const destroyNotify: Subject<void> =
            type.prototype[
              OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_KILL_NOTIFY
            ];
          destroyNotify.next();
          destroyNotify.complete();
          type.prototype[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_STORE] = {};
        };
      })(type.prototype.ngOnDestroy);
    })(_type);
  };
}
export function useFormErrorObservable<T>(instance: T) {
  ensureClassIsDecorated(
    instance,
    Object.values(OBSERVABLE_FORM_ERROR_PROPNAME)
  );
  return (
    keyName: string,
    func: () => AbstractControl,
    translations: {
      [key: string]: (errors: any, control: AbstractControl) => ControlErrorBag;
    }
  ): Observable<ControlErrorBag> => {
    if (instance[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_STORE][keyName])
      return instance[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_STORE][keyName];
    return (instance[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_STORE][
      keyName
    ] = createErrorObservable(func, translations).pipe(
      takeUntil(instance[OBSERVABLE_FORM_ERROR_PROPNAME.OBSERVABLE_KILL_NOTIFY])
    ));
  };
}
export function createErrorObservable(
  func: () => AbstractControl,
  translations: {
    [key: string]: (errors: any, control: AbstractControl) => ControlErrorBag;
  }
): Observable<ControlErrorBag> {
  const control = func();
  return control.statusChanges.pipe(
    map(() => control.errors),
    map((x) => {
      if (!x) return null;
      const [key, translateByKey] = Object.entries(translations).find(
        ([_key]) => !!x[_key]
      );
      return translateByKey(x[key], control);
    })
  );
}

function ensureClassIsDecorated(
  instance: InstanceType<any>,
  properties: string[]
): never | void {
  const prototype = Object.getPrototypeOf(instance);
  const missingDecorator = !properties.every((prop) => prop in prototype);

  if (missingDecorator) {
    throw new Error(
      'this operator cannot be used inside components' +
        ' that are not decorated with ' +
        properties.join(', ') +
        ' decorator'
    );
  }
}

export interface ControlErrorBag {
  content: string;
  args?: {
    [key: string]: any;
  };
}
