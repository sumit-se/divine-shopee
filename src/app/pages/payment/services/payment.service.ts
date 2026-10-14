import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CrudService } from '../../shared/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private crudService: CrudService
  ) {
  }
  getPaymentModules(): Observable<any> {
    return this.crudService.get('/v1/private/modules/payment');
  }
  getPaymentModulesDetails(type): Observable<any> {
    return this.crudService.get('/v1/private/modules/payment/' + type);
  }
  savePayment(param) {
    return this.crudService.post('/v1/private/modules/payment/', param);
  }
  // Removes the stored configuration for a module, credentials included. The
  // module stays registered and can be configured again.
  deletePayment(code): Observable<any> {
    return this.crudService.delete('/v1/private/modules/payment/' + code);
  }
}
