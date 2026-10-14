import { Injectable } from '@angular/core';

import { CrudService } from '../../../shared/services/crud.service';
import { Observable } from 'rxjs';
import { StorageService } from '../../../shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class VariationService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService
  ) {
  }

  checkCode(code): Observable<any> {
    const params = {
      'code': code,
    };
    return this.crudService.get(`/v2/private/product/variation/unique`, params);
  }

  addVariations(param): Observable<any> {
    return this.crudService.post(`/v2/private/product/variation`, param);
  }
  getListOfVariations(params?): Observable<any> {
    // 'variations', plural: the singular path is mapped for POST only
    // (ProductVariationApi), so a GET there came back 405 and the variations
    // list -- and any dropdown built from it -- stayed empty.
    return this.crudService.get(`/v2/private/product/variations`, params);
  }
}
