import { Injectable } from '@angular/core';

import { CrudService } from '../../../shared/services/crud.service';
import { Observable } from 'rxjs';

/**
 * Product variants (ProductVariantApi, /api/v2).
 *
 * The backend has had these endpoints all along; nothing in the admin called
 * them, so variants created by a data load were invisible here and could only
 * be managed through the database.
 *
 * All paths contain /private/, so the auth interceptor adds the `store` query
 * parameter for the logged-in merchant.
 */
@Injectable({
  providedIn: 'root'
})
export class ProductVariantService {

  constructor(
    private crudService: CrudService
  ) {
  }

  getListOfVariants(productId, params?): Observable<any> {
    return this.crudService.get(`/v2/private/product/${productId}/variants`, params);
  }

  getVariantById(productId, variantId, params?): Observable<any> {
    return this.crudService.get(`/v2/private/product/${productId}/variant/${variantId}`, params);
  }

  createVariant(productId, variant): Observable<any> {
    return this.crudService.post(`/v2/private/product/${productId}/variant`, variant);
  }

  updateVariant(productId, variantId, variant): Observable<any> {
    return this.crudService.put(`/v2/private/product/${productId}/variant/${variantId}`, variant);
  }

  deleteVariant(productId, variantId): Observable<any> {
    return this.crudService.delete(`/v2/private/product/${productId}/variant/${variantId}`);
  }

  checkSku(productId, sku): Observable<any> {
    return this.crudService.get(`/v2/private/product/${productId}/variant/${sku}/unique`);
  }

  /**
   * Stock and price live on the variant's inventory record, not on the variant
   * itself, and they go through the inventory API.
   *
   * Not sent with the variant payload on edit: that mapper *adds* an inventory
   * row rather than updating the existing one, which would leave the variant
   * with two stock rows and an ambiguous price.
   */
  createInventory(productId, inventory): Observable<any> {
    return this.crudService.post(`/v1/private/product/${productId}/inventory`, inventory);
  }

  updateInventory(productId, inventoryId, inventory): Observable<any> {
    return this.crudService.put(`/v1/private/product/${productId}/inventory/${inventoryId}`, inventory);
  }

  /**
   * A variant's own images (ProductVariantImageApi). Every call answers with the
   * variant's images, main image first.
   */
  getVariantImages(productId, variantId): Observable<any> {
    return this.crudService.get(`/v2/private/product/${productId}/variant/${variantId}/images`);
  }

  addVariantImage(productId, variantId, file: File): Observable<any> {
    const data = new FormData();
    data.append('file', file, file.name);
    return this.crudService.post(`/v2/private/product/${productId}/variant/${variantId}/image`, data);
  }

  removeVariantImage(productId, variantId, imageId): Observable<any> {
    return this.crudService.delete(`/v2/private/product/${productId}/variant/${variantId}/image/${imageId}`);
  }

  setMainVariantImage(productId, variantId, imageId): Observable<any> {
    return this.crudService.put(`/v2/private/product/${productId}/variant/${variantId}/image/${imageId}/default`, {});
  }
}
