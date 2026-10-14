import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ProductService } from '../services/product.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

/**
 * "Special" cell of the product list: a star that shows whether the product
 * is in the hand-picked Special category, and adds / removes it with one click.
 * It only changes the Special category -- whether the product is on the site at
 * all is the "On site" column.
 * The row carries the Special category id (resolved by code by the list).
 */
@Component({
  template: `
    <button *ngIf="rowData.specialCategoryId" type="button" class="special-star" [class.special-star--on]="value"
      [disabled]="saving" (click)="toggle($event)"
      [title]="(value ? 'PRODUCT.SPECIAL_UNLIST_HINT' : 'PRODUCT.SPECIAL_LIST_HINT') | translate">
      {{ value ? '★' : '☆' }} {{ 'PRODUCT.SPECIAL' | translate }}
    </button>`,
  styles: [`
    .special-star {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap;
      cursor: pointer; background: #fff; color: #a0a0a0; border: 1px solid #dcdcdc;
    }
    .special-star:hover { color: #9a6a2f; border-color: #d4a15a; background: #fff6ea; }
    .special-star--on { background: #e8751a; color: #fff; border-color: #e8751a; }
    .special-star--on:hover { background: #c95f0e; color: #fff; border-color: #c95f0e; }
    .special-star:disabled { opacity: .6; cursor: wait; }
  `],
})
export class SpecialToggleComponent {
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
    const categoryId = this.rowData.specialCategoryId;
    const call = listing
      ? this.productService.addProductToCategory(this.rowData.id, categoryId)
      : this.productService.removeProductFromCategory(this.rowData.id, categoryId);
    this.saving = true;
    call.subscribe(() => {
      this.saving = false;
      this.value = listing;
      this.rowData.special = listing;
      this.toastr.success(this.translate.instant(listing ? 'PRODUCT.SPECIAL_LISTED' : 'PRODUCT.SPECIAL_UNLISTED',
        { name: this.rowData.name }));
      this.changed.emit(this.rowData);
    }, () => {
      this.saving = false;
      this.toastr.error(this.translate.instant('PRODUCT.SPECIAL_FAILED'));
    });
  }

}
