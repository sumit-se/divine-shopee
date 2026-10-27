import { Injectable } from '@angular/core';

import { CrudService } from '../../../shared/services/crud.service';
import { Observable } from 'rxjs';
import { StorageService } from '../../../shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ProductImageService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService
  ) {
  }

  addImageUrl(id) {//post
    // API exposes /image (singular); /images 404s
    return this.crudService.getBaseUrl() + `/v1/private/product/${id}/image`;
  }

  removeImageUrl(id) {//delete
    return this.crudService.getBaseUrl() + `/v1/private/product/${id}/image`;
  }

  getImages(productId): Observable<any> {
    // store is required; without it the request falls back to DEFAULT and 404s
    // for products belonging to any other merchant
    const params = { store: this.storageService.getMerchant() };
    return this.crudService.get(`/v1/product/${productId}/images`, params);
  }

  /** a YouTube video, shown in the product's gallery with its photos (ProductVideoApi) */
  addVideo(productId, url): Observable<any> {
    return this.crudService.post(`/v1/private/product/${productId}/video`, { url });
  }

  removeImage(productId, imageId): Observable<any> {
    return this.crudService.delete(`/v1/private/product/${productId}/image/${imageId}`);
  }

  createImage(id, uploadData): Observable<any> {
    return this.crudService.post(`/v1/private/product/${id}/image`, uploadData);
  }

  updateImage(productId, event): Observable<any> {
    return this.crudService.patch(`/v1/private/product/${productId}/image/${event.id}?order=${event.position}`, []);
  }

  /**
   * Saves the whole sequence in one request: the body is the image ids in the
   * order they should appear. Saving only the image that moved left the others
   * where they were, and saving them one call each raced -- the calls worked
   * from separate copies of the product and overwrote each other's positions.
   * The first image also becomes the product's main picture.
   */
  updateImageOrder(productId, images): Observable<any> {
    const ids = images.map(image => image.id);
    return this.crudService.patch(`/v1/private/product/${productId}/images/order`, ids);
  }

  setDefaultImage(productId, imageId): Observable<any> {
    return this.crudService.patch(`/v1/private/product/${productId}/image/${imageId}?defaultImage=true`, []);
  }

}
