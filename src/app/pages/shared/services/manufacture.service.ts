import { Injectable } from '@angular/core';

import { CrudService } from './crud.service';
import { StorageService } from './storage.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ManufactureService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService,
  ) {
  }

  getManufacturers(): Observable<any> {
    // This is a public path, so the auth interceptor's /private/ default does
    // not scope it, and without 'store' the facade falls back to DEFAULT --
    // the product form's brand dropdown then offered DEFAULT's manufacturers
    // instead of this merchant's, so no brand of theirs could be picked.
    const params = {
      store: this.storageService.getMerchant()
    };
    return this.crudService.get(`/v1/manufacturers/`, params);
  }
}
