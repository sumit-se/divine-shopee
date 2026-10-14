import { Injectable } from '@angular/core';

import { CrudService } from '../../shared/services/crud.service';
import { Observable } from 'rxjs';
import { StorageService } from '../../shared/services/storage.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '../models/store';

@Injectable({
  providedIn: 'root'
})
export class StoreService {


  constructor(
    private crudService: CrudService,
    private storageService: StorageService
  ) {
  }


  getStore(code): Observable<any> {
    return this.crudService.get(`/v1/store/${code}`);
  }

  getListOfStores(params): Observable<any> {
    // 'code' filters the result set; 'store' sets the authorization context.
    // Without 'store' the API falls back to DEFAULT, and a non-superadmin who
    // belongs to another merchant gets 401 -- which the auth interceptor turns
    // into a forced sign-out. Superadmins are exempt, so this only shows up for
    // ADMIN-level accounts.
    const merged = { store: this.storageService.getMerchant(), ...(params || {}) };
    return this.crudService.get(`/v1/private/stores`, merged);
  }

  getListOfMerchantStoreNames(params): Observable<any> {
    return this.crudService.get(`/v1/private/stores/names`, params);
  }

  checkIfStoreExist(code): Observable<any> {
    const params = {
      'code': code,
    };
    return this.crudService.get(`/v1/private/store/unique`, params);
  }

  createStore(store: any): Observable<any> {
    return this.crudService.post(`/v1/private/store`, store);
  }

  deleteStore(storeCode: any): Observable<any> {
    return this.crudService.delete(`/v1/private/store/${ storeCode }`);
  }

  updateStore(store: any): Observable<any> {
    return this.crudService.put(`/v1/private/store/${ store.code }`, store);
  }

  // PAGE CONTENT

  getPageContent(pageCode: string, storeCode: string): Observable<any> {
    const params = {
      lang: '_all',
      store: storeCode
    };
    return this.crudService.getWithEmpty(`/v1/private/content/any/${pageCode}`, params);
  }

  updatePageContent(id, content: any): Observable<any> {
    return this.crudService.put(`/v1/private/content/${id}`, content);
  }

  createPageContent(content: any, storeCode: string) : Observable<any> {

    return this.crudService.postWithStoreParam(`/v1/private/content`, content, storeCode);
  }

  // end PAGE CONTENT

  // start BRANDING

  getBrandingDetails(code): Observable<any> {
    return this.crudService.get(`/v1/private/store/${code}/marketing`);
  }

  updateSocialNetworks(body: any): Observable<any> {
    const code = this.storageService.getMerchant();
    return this.crudService.post(`/v1/private/store/${code}/marketing`, body);
  }

  addStoreLogo(file: any): Observable<any> {
    const code = this.storageService.getMerchant();
    const uploadData = new FormData();
    uploadData.append('file', file, file.name);
    return this.crudService.post(`/v1/private/store/${code}/marketing/logo`, uploadData);
  }

  removeStoreLogo(code: string): Observable<any> {
    return this.crudService.delete(`/v1/private/store/${code}/marketing/logo`);
  }

  // end BRANDING

}
