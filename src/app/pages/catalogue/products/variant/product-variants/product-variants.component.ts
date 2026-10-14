import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService } from '@nebular/theme';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { ProductVariantService } from '../../services/product-variant.service';
import { ProductService } from '../../services/product.service';
import { StorageService } from '../../../../shared/services/storage.service';
import { ShowcaseDialogComponent } from '../../../../shared/components/showcase-dialog/showcase-dialog.component';
import { VariantFormComponent } from '../variant-form/variant-form.component';

/**
 * Variants of one product: the individual sellable items behind the parent,
 * each with its own SKU and its own stock.
 *
 * Modelled on the product attributes tab next door -- same table, paginator and
 * dialog-based form.
 */
@Component({
  selector: 'ngx-product-variants',
  templateUrl: './product-variants.component.html',
  styleUrls: ['./product-variants.component.scss']
})
export class ProductVariantsComponent implements OnInit {

  id: any;
  loading = false;
  source: LocalDataSource = new LocalDataSource();
  settings = {};

  // paginator
  perPage = 20;
  currentPage = 1;
  totalCount = 0;

  params = this.loadParams();

  constructor(
    private productVariantService: ProductVariantService,
    private productService: ProductService,
    private location: Location,
    private router: Router,
    private storageService: StorageService,
    private dialogService: NbDialogService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
  }

  loadParams() {
    return {
      lang: this.storageService.getLanguage(),
      count: this.perPage,
      page: 0,
    };
  }

  ngOnInit() {
    this.id = this.productService.getProductIdRoute(this.router, this.location);

    const el = document.getElementById('tabs');
    if (el) {
      el.scrollIntoView();
    }

    this.getList();

    this.translate.onLangChange.subscribe(() => {
      this.params.lang = this.storageService.getLanguage();
      this.getList();
    });
  }

  getList() {
    this.loading = true;
    this.params.page = this.currentPage - 1;
    this.productVariantService.getListOfVariants(this.id, this.params)
      .subscribe(res => {
        this.source.load(res && res.items ? res.items : []);
        this.totalCount = res ? res.recordsTotal : 0;
        this.loading = false;
      }, error => {
        // a silent empty table hides a 401/500; say what happened
        this.source.load([]);
        this.loading = false;
        const message = error && error.error && error.error.message
          ? error.error.message
          : this.translate.instant('COMMON.SOMETHING_WRONG');
        this.toastr.error(message);
      });
    this.setSettings();
  }

  setSettings() {
    this.settings = {
      hideSubHeader: true,
      actions: {
        columnTitle: this.translate.instant('ORDER.ACTIONS'),
        add: false,
        edit: false,
        delete: false,
        position: 'right',
        sort: true,
        custom: [
          { name: 'edit', title: '<i class="nb-edit"></i>' },
          { name: 'remove', title: '<i class="nb-trash"></i>' }
        ],
      },
      pager: {
        display: false
      },
      columns: {
        id: {
          title: this.translate.instant('COMMON.ID'),
          type: 'number',
          editable: false,
          filter: false
        },
        sku: {
          title: this.translate.instant('PRODUCT_VARIANTS.SKU'),
          type: 'string',
          editable: false,
          filter: false
        },
        variation: {
          title: this.translate.instant('PRODUCT_VARIANTS.VARIATION'),
          type: 'string',
          editable: false,
          filter: false,
          // the readable variation carries the option and value it stands for
          valuePrepareFunction: (variation) => {
            if (!variation) {
              return '';
            }
            return this.variationLabel(variation);
          }
        },
        // price and stock both live on the variant's own inventory record.
        // ng2-smart-table keys a column by a field name, so the same field is
        // read twice with different prepare functions.
        price: {
          title: this.translate.instant('PRODUCT_VARIANTS.PRICE'),
          type: 'string',
          editable: false,
          filter: false,
          valuePrepareFunction: (cell, row) => {
            const rows = (row && row.inventory) || [];
            const priced = rows.find(i => i.price);
            return priced ? priced.price : '';
          }
        },
        inventory: {
          title: this.translate.instant('PRODUCT_VARIANTS.QUANTITY'),
          type: 'string',
          editable: false,
          filter: false,
          valuePrepareFunction: (inventory) => {
            if (!inventory || inventory.length === 0) {
              return this.translate.instant('PRODUCT_VARIANTS.NO_INVENTORY');
            }
            return inventory.map(i => i.quantity).join(', ');
          }
        },
        available: {
          title: this.translate.instant('PRODUCT_VARIANTS.AVAILABLE'),
          type: 'string',
          editable: false,
          filter: false,
          valuePrepareFunction: (available) => {
            return available
              ? this.translate.instant('COMMON.YES')
              : this.translate.instant('COMMON.NO');
          }
        },
        defaultSelection: {
          title: this.translate.instant('PRODUCT_VARIANTS.DEFAULT'),
          type: 'string',
          editable: false,
          filter: false,
          valuePrepareFunction: (isDefault) => {
            return isDefault
              ? this.translate.instant('COMMON.YES')
              : this.translate.instant('COMMON.NO');
          }
        },
        sortOrder: {
          title: this.translate.instant('COMMON.ORDER'),
          type: 'string',
          editable: false,
          filter: false
        }
      }
    };
  }

  /**
   * "Lab Test Report: RDP0026864". The readable option value carries its name
   * under `description` for some endpoints and directly on the entity for
   * others, so both are tried before falling back to the code.
   */
  variationLabel(variation): string {
    if (!variation) {
      return '';
    }
    const option = variation.option || {};
    const value = variation.optionValue || {};
    const optionName = option.name || (option.description && option.description.name) || option.code || '';
    const valueName = value.name || (value.description && value.description.name) || value.code || '';
    if (optionName && valueName) {
      return optionName + ': ' + valueName;
    }
    return valueName || optionName || variation.code || '';
  }

  changePage(event) {
    switch (event.action) {
      case 'onPage': {
        this.currentPage = event.data;
        break;
      }
      case 'onPrev': {
        this.currentPage--;
        break;
      }
      case 'onNext': {
        this.currentPage++;
        break;
      }
      case 'onFirst': {
        this.currentPage = 1;
        break;
      }
      case 'onLast': {
        this.currentPage = event.data;
        break;
      }
    }
    this.getList();
  }

  route(event) {
    switch (event.action) {
      case 'edit':
        this.openForm(event.data.id);
        break;
      case 'remove':
        this.removeVariant(event.data.id);
        break;
    }
  }

  onClickAdd() {
    this.openForm(null);
  }

  private openForm(variantId) {
    this.dialogService.open(VariantFormComponent, {
      context: {
        productId: this.id,
        variantId: variantId
      }
    }).onClose.subscribe(() => {
      this.getList();
    });
  }

  removeVariant(id) {
    this.dialogService.open(ShowcaseDialogComponent, {})
      .onClose.subscribe(res => {
        if (res) {
          this.loading = true;
          this.productVariantService.deleteVariant(this.id, id).subscribe(() => {
            this.loading = false;
            this.toastr.success(this.translate.instant('PRODUCT_VARIANTS.VARIANT_REMOVED'));
            this.getList();
          }, () => {
            this.loading = false;
          });
        }
      });
  }
}
