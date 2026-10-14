import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ProductService } from '../services/product.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

/**
 * "On site" cell of the product list: a listed product is shown on the
 * storefront; an unlisted one (available off) is hidden from category pages,
 * search, featured items and its own page, and cannot be bought. It stays in
 * the admin and can be listed again at any time.
 */
@Component({
  template: `
    <div class="on-site-cell">
      <span class="on-site-state" [class.on-site-state--off]="!value">
        {{ (value ? 'PRODUCT.ON_SITE_LISTED' : 'PRODUCT.ON_SITE_UNLISTED') | translate }}
      </span>
      <button type="button" class="on-site-btn" [class.on-site-btn--unlist]="value" [disabled]="saving"
        (click)="toggle($event)"
        [title]="(value ? 'PRODUCT.ON_SITE_UNLIST_HINT' : 'PRODUCT.ON_SITE_LIST_HINT') | translate">
        {{ (value ? 'PRODUCT.ON_SITE_UNLIST' : 'PRODUCT.ON_SITE_LIST') | translate }}
      </button>
    </div>`,
  styles: [`
    .on-site-cell { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .on-site-state {
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap;
      background: #e6f4ea; color: #1e7e34;
    }
    .on-site-state::before { content: '●'; margin-right: 4px; }
    .on-site-state--off { background: #eceff1; color: #616161; }
    .on-site-btn {
      padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: 600; white-space: nowrap;
      cursor: pointer; background: #fff; color: #1e7e34; border: 1px solid #8fcf9f;
    }
    .on-site-btn:hover { background: #1e7e34; color: #fff; border-color: #1e7e34; }
    .on-site-btn--unlist { color: #b3261e; border-color: #e3a19c; }
    .on-site-btn--unlist:hover { background: #b3261e; color: #fff; border-color: #b3261e; }
    .on-site-btn:disabled { opacity: .6; cursor: wait; }
  `],
})
export class OnSiteToggleComponent {
  @Input() value: boolean;
  @Input() rowData: any;
  @Output() changed = new EventEmitter<any>();
  saving = false;

  constructor(
    private productService: ProductService,
    private translate: TranslateService,
    private toastr: ToastrService,
  ) {
  }

  toggle(event) {
    event.stopPropagation();
    const listing = !this.value;
    const name = this.rowData.description ? this.rowData.description.name : this.rowData.sku;
    if (!listing && !window.confirm(this.translate.instant('PRODUCT.ON_SITE_UNLIST_CONFIRM', { name }))) {
      return;
    }
    const product = {
      available: listing,
      price: this.rowData.price,
      quantity: this.rowData.quantity
    };
    this.saving = true;
    this.productService.updateProductFromTable(this.rowData.id, product)
      .subscribe(() => {
        this.saving = false;
        this.value = listing;
        this.rowData.available = listing;
        this.toastr.success(this.translate.instant(listing ? 'PRODUCT.ON_SITE_LISTED_DONE' : 'PRODUCT.ON_SITE_UNLISTED_DONE', { name }));
        this.changed.emit(this.rowData);
      }, () => {
        this.saving = false;
        this.toastr.error(this.translate.instant('PRODUCT.ON_SITE_FAILED'));
      });
  }

}
