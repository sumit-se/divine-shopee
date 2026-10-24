import { Injectable } from '@angular/core';

import { CrudService } from '../../../shared/services/crud.service';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { StorageService } from '../../../shared/services/storage.service';
import { UrlTree, UrlSegment, UrlSegmentGroup, ActivatedRoute, Router, PRIMARY_OUTLET } from '@angular/router';
import {Location} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private crudService: CrudService,
    private storageService: StorageService,
  ) {
  }

  getListOfProducts(params): Observable<any> {
    //release 3.2.1 use V2
    return this.crudService.get(`/v2/products`, params);
  }

  updateProductFromTable(id, product): Observable<any> {
    return this.crudService.patch(`/v1/private/product/${id}`, product);
  }

  updateProduct(id, product): Observable<any> {
    const params = {
      store: this.storageService.getMerchant()
    };
    return this.crudService.put(`/v2/private/product/${id}`, product, { params });
  }

  getProductById(id): Observable<any> {
    const params = {
      lang: '_all',
      // without store the request falls back to DEFAULT and 500s for any
      // product belonging to another merchant
      store: this.storageService.getMerchant()
    };
    // /v1/product/{id} is commented out upstream ("Removed in 3.2.5 in favor
    // of /product/sku"), so the path falls through to /product/{friendlyUrl}
    // and 500s. v2 serves the same product and honours lang=_all.
    return this.crudService.get(`/v2/private/product/${id}`, params);
  }

  getProductDefinitionById(id): Observable<any> {
    const params = {
      lang: '_all'
    };
    return this.crudService.get(`/v2/private/product/${id}`, params);
  }

  getProductDefinitionBySku(sku): Observable<any> {
    const params = {
      lang: '_all'
    };
    return this.crudService.get(`/v2/product/${sku}`, params);
  }

  createProduct(product): Observable<any> {
    const params = {
      store: this.storageService.getMerchant()
    };
    return this.crudService.post(`/v2/private/product`, product, { params });
  }

  deleteProduct(id): Observable<any> {
    return this.crudService.delete(`/v1/private/product/${id}`);
  }

  duplicateProduct(id: number): Observable<any> {
    return this.getProductById(id).pipe(
      switchMap(original => {
        const copy = this.buildDuplicatePayload(original);
        return this.createProduct(copy).pipe(
          switchMap(created => {
            const categoryIds = (original.categories || []).map((c: any) => c.id);
            if (categoryIds.length === 0) {
              return of(created);
            }
            return forkJoin(
              categoryIds.map((catId: number) => this.addProductToCategory(created.id, catId))
            ).pipe(map(() => created));
          })
        );
      })
    );
  }

  private buildDuplicatePayload(product: any): any {
    // Short random suffix so SKU + friendlyUrl stay unique on repeated copies
    const suffix = '-copy-' + Date.now().toString(36).slice(-4);
    return {
      sku: product.sku + suffix,
      visible: product.visible,
      available: false,
      canBePurchased: product.canBePurchased,
      dateAvailable: product.dateAvailable,
      manufacturer: product.manufacturer ? product.manufacturer.code : '',
      type: product.type ? product.type.code : '',
      price: product.price,
      discountedPrice: product.discountedPrice || null,
      quantity: product.quantity,
      sortOrder: product.sortOrder,
      productSpecifications: {
        weight: product.productSpecifications ? product.productSpecifications.weight : '',
        height: product.productSpecifications ? product.productSpecifications.height : '',
        width: product.productSpecifications ? product.productSpecifications.width : '',
        length: product.productSpecifications ? product.productSpecifications.length : '',
      },
      descriptions: (product.descriptions || []).map((d: any) => ({
        language: d.language,
        name: 'Copy of ' + d.name,
        highlights: d.highlights || '',
        friendlyUrl: d.friendlyUrl + suffix,
        description: d.description || '',
        title: d.title || '',
        keyWords: d.keyWords || '',
        metaDescription: d.metaDescription || '',
      })),
    };
  }

  getProductTypes(): Observable<any> {
    return this.crudService.get(`/v1/private/product/types`);
  }

  checkProductSku(code): Observable<any> {
    const params = {
      'code': code,
    };
    return this.crudService.get(`/v1/private/product/unique`, params);
  }

  addProductToCategory(productId, categoryId): Observable<any> {
    return this.crudService.post(`/v1/private/product/${productId}/category/${categoryId}`, {});
  }

  removeProductFromCategory(productId, categoryId): Observable<any> {
    return this.crudService.delete(`/v1/private/product/${productId}/category/${categoryId}`);
  }
  getProductByOrder(): Observable<any> {
    return this.crudService.get(`/v1/product?count=200&lang=en&page=0`)
  }
  getProductOrderById(id): Observable<any> {
    return this.crudService.get(`/v1/product?category=${id}&count=200&lang=en&page=0`)
  }
  getProductIdRoute(router: Router, location: Location) {
    const tree: UrlTree = router.parseUrl(location.path());
    const g: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];
    const s: UrlSegment[] = g.segments; // returns 2 segments
    return s[4].path;
  }

}
