import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CrudService } from '../shared/services/crud.service';
import { StorageService } from '../shared/services/storage.service';

@Injectable({ providedIn: 'root' })
export class EnquiriesService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService
  ) { }

  getEnquiries(): Observable<any> {
    // every private listing is scoped to a store; without it the request falls
    // back to DEFAULT and returns nothing for this merchant
    const params = { store: this.storageService.getMerchant(), lang: this.storageService.getLanguage() };
    return this.crudService.get('/v1/private/enquiries', params);
  }

  setStatus(id, status): Observable<any> {
    // patch() passes its third argument straight to HttpClient, so the query
    // string has to travel inside `params`
    const params = { store: this.storageService.getMerchant(), status };
    return this.crudService.patch(`/v1/private/enquiry/${id}/status`, [], { params });
  }
}
