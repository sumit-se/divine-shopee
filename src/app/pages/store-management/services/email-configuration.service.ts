import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CrudService } from '../../shared/services/crud.service';
import { StorageService } from '../../shared/services/storage.service';

/**
 * The store's outgoing mail settings.
 *
 * These used to live in email.properties on the server, which meant a shell
 * and a restart to change them -- and a plaintext SMTP password sitting in the
 * deployment. They are now a row in MERCHANT_CONFIGURATION, encrypted, and
 * this is how the console reads and writes it.
 *
 * 'store' is both the configuration being addressed and the authorization
 * context the API checks, so every call carries it.
 */
@Injectable({
  providedIn: 'root'
})
export class EmailConfigurationService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService
  ) {
  }

  /** The stored settings. The password is never part of the response. */
  getEmailConfiguration(): Observable<any> {
    return this.crudService.get(`/v1/private/configurations/email`, { store: this.storageService.getMerchant() });
  }

  /** Saving without a password keeps the one already stored. */
  saveEmailConfiguration(config: any): Observable<any> {
    // POST /v1/private/configurations/email returns HTTP 200 with an empty body.
    return this.crudService.postWithStoreParam(
      `/v1/private/configurations/email`, config, this.storageService.getMerchant(),
      { responseType: 'text' as 'json' });
  }

}
