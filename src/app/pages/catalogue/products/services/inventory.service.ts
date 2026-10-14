import { Injectable } from '@angular/core';
import { CrudService } from '../../../shared/services/crud.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(
    private crudService: CrudService
  ) {
  }

  /**
   * Every inventory row of a product: its own, plus one per variant.
   *
   * `/product/{x}/inventory` takes a SKU, not an id, so calling it with the
   * numeric product id asked the catalogue for a product with sku "50" and came
   * back 500 -- which is why this list only ever showed "No data found". The
   * endpoint that takes an id is the one below, with productId as a parameter.
   */
  getListOfInventories(idProduct, params): Observable<any> {
    return this.crudService.get(`/v1/private/product/inventory`, { ...params, productId: idProduct });
  }

  createInventory(idProduct, inventory): Observable<any> {
    return this.crudService.post(`/v1/private/product/${idProduct}/inventory`, inventory);
  }

  /**
   * There is no endpoint for a single inventory row, so it is picked out of the
   * product's list.
   */
  getInventoryById(idProduct, idInventory): Observable<any> {
    return this.getListOfInventories(idProduct, { count: 100, page: 0 })
      .pipe(map(res => (res.items || []).find(item => String(item.id) === String(idInventory)) || {}));
  }

  deleteInventory(idProduct, idInventory): Observable<any> {
    return this.crudService.delete(`/v1/private/product/${idProduct}/inventory/${idInventory}`);
  }

  updateInventory(idProduct, idInventory, inventory): Observable<any> {
    return this.crudService.put(`/v1/private/product/${idProduct}/inventory/${idInventory}`, inventory);
  }

}
