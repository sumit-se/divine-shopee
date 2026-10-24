import { Component, OnInit, SystemJsNgModuleLoader } from '@angular/core';
import { ProductService } from '../services/product.service';
import { LocalDataSource } from 'ng2-smart-table';
import { AvailableButtonComponent } from './available-button.component';
import { SpecialToggleComponent } from './special-toggle.component';
import { OnSiteToggleComponent } from './on-site-toggle.component';
import { CategoryService } from '../../categories/services/category.service';
import { ShowcaseDialogComponent } from '../../../shared/components/showcase-dialog/showcase-dialog.component';
import { NbDialogService } from '@nebular/theme';
import { StoreService } from '../../../store-management/services/store.service';
import { UserService } from '../../../shared/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../../shared/services/storage.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ListingService } from '../../../shared/services/listing.service';


@Component({
  selector: 'ngx-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {
  products = [];
  source: LocalDataSource = new LocalDataSource();
  listingService: ListingService;
  loadingList = false;
  loading: boolean = false;
  stores = [];
  isSuperadmin: boolean;
  selectedStore: String = '';
  // paginator
  perPage = 20;
  currentPage = 1;
  totalCount;
  merchant;

  // server params
  params = this.loadParams();
  settings = {};

  // the hand-picked "Special" category (code 'special'), looked up by code
  static readonly SPECIAL_CODE = 'special';
  specialCategoryId: number = null;
  specialOnly = false;
  // products unlisted from the site (available off)
  unlistedOnly = false;

  constructor(
    private userService: UserService,
    private productService: ProductService,
    private dialogService: NbDialogService,
    private storeService: StoreService,
    private translate: TranslateService,
    private storageService: StorageService,
    private toastr: ToastrService,
    private router: Router,
    private categoryService: CategoryService
  ) {
    this.selectedStore = this.storageService.getMerchant()
    this.isSuperadmin = this.storageService.getUserRoles().isSuperadmin;
    this.listingService = new ListingService();
  }

  loadParams() {
    return {
      store: this.storageService.getMerchant(),
      lang: this.storageService.getLanguage(),
      count: this.perPage,
      origin: "admin", //does not load attributes in listing
      page: 0
    };
  }

  ngOnInit() {
    this.getStore();
    this.loadSpecialCategory();
    this.getList();
    this.translate.onLangChange.subscribe((lang) => {
      this.params.lang = this.storageService.getLanguage();
      this.getList();
    });


    //ng2-smart-table server side filter //list in field
    this.source.onChanged().subscribe((change) => {
      if (!this.loadingList) {//listing service
        //callback from filter
        this.listingService.filterDetect(this.params, change, this.loadList.bind(this), this.resetList.bind(this));
      }
    });
  }

  fetchTableData(){
    this.loadingList = true;
    this.productService.getListOfProducts(this.params)
      .subscribe(res => {
        const products = res.products;
        this.totalCount = res.recordsTotal;
        products.forEach(el => {
          el.special = (el.categories || []).some(c => c.code === ProductsListComponent.SPECIAL_CODE);
          el.specialCategoryId = this.specialCategoryId;
          el.name = this.nameCell(el);
        });
        this.products = [...products];
        this.source.load(products);
        this.loadingList = false;
      });

 }

  /** product name, with a SPECIAL tag when it is in the Special category */
  private nameCell(product) {
    let name = product.description.name;
    if (product.special) {
      name += ' <span class="special-badge">★ ' + this.translate.instant('PRODUCT.SPECIAL') + '</span>';
    }
    if (!product.available) {
      name += ' <span class="unlisted-badge">' + this.translate.instant('PRODUCT.ON_SITE_UNLISTED') + '</span>';
    }
    return name;
  }

  private loadSpecialCategory() {
    this.categoryService.getListOfCategories({
      store: this.storageService.getMerchant(),
      lang: this.storageService.getLanguage(),
      count: 200
    }).subscribe(res => {
      const special = (res.categories || []).find(c => c.code === ProductsListComponent.SPECIAL_CODE);
      this.specialCategoryId = special ? special.id : null;
      // rows loaded before the lookup came back get the id now
      this.products.forEach(el => el.specialCategoryId = this.specialCategoryId);
      this.source.refresh();
    });
  }

  /** "Special only" filter */
  toggleSpecialOnly() {
    this.specialOnly = !this.specialOnly;
    this.currentPage = 1;
    this.getList();
  }

  /** "Unlisted only" filter */
  toggleUnlistedOnly() {
    this.unlistedOnly = !this.unlistedOnly;
    this.currentPage = 1;
    this.getList();
  }

  /** a product was listed on / unlisted from the site from its row */
  onSiteChanged(product) {
    if (this.unlistedOnly && product.available) {
      this.getList(); // it no longer belongs in this filtered list
      return;
    }
    product.name = this.nameCell(product);
    this.source.refresh();
  }

  /** a product was added to / removed from Special from its row */
  specialChanged(product) {
    if (this.specialOnly && !product.special) {
      this.getList(); // it no longer belongs in this filtered list
      return;
    }
    product.name = this.nameCell(product);
    this.source.refresh();
  }

  /** callback methods for table list*/
  private loadList(newParams: any) {
    console.log(JSON.stringify(newParams));
    this.currentPage = 1; //back to page 1
    this.params = newParams;
    this.fetchTableData();
  }

  private resetList() {
    this.currentPage = 1;//back to page 1
    this.params = this.loadParams();
    this.getList();
  }
  /** */

  getStore() {
    // Was hardcoded to 'DEFAULT'. A non-superadmin belonging to another
    // merchant gets 401 on that store, and the auth interceptor treats the
    // 401 as an expired session and signs them out -- which surfaced as
    // "edit product is broken" on this page. Scope to the user's own store.
    const storeCode = this.storageService.getMerchant() || 'DEFAULT';
    this.storeService.getListOfStores({ code: storeCode })
      .subscribe(res => {
        let storeData = []
        res.data.forEach((store) => {
          storeData.push(store.code);
        });
        this.stores = storeData;
      });
  }

  getList() {
    const startFrom = this.currentPage - 1;
    this.params.page = startFrom;
    if (this.specialOnly && this.specialCategoryId) {
      this.params['categoryIds'] = this.specialCategoryId;
    } else {
      delete this.params['categoryIds'];
    }
    if (this.unlistedOnly) {
      this.params['available'] = false;
    } else {
      delete this.params['available'];
    }
    this.fetchTableData();
    this.setSettings();
  }

  setSettings() {
    this.settings = {
      actions: {
        columnTitle: this.translate.instant('ORDER.ACTIONS'),
        add: false,
        edit: false,
        delete: false,
        position: 'right',
        sort: true,
        custom: [
          { name: 'edit', title: '<i class="nb-edit"></i>' },
          { name: 'copy', title: '<i class="nb-copy"></i>' },
          { name: 'remove', title: '<i class="nb-trash"></i>' }
        ],
      },
      pager: {
        display: false
      },
      rowClassFunction: (row) => [row.data.special ? 'special-row' : '', row.data.available ? '' : 'unlisted-row'].join(' '),
      columns: {
        id: {
          title: this.translate.instant('COMMON.ID'),
          type: 'number',
          editable: false,
          filter: false
        },
        sku: {
          title: this.translate.instant('PRODUCT.SKU'),
          type: 'string',
          editable: false,
          filter: true
        },
        name: {
          title: this.translate.instant('PRODUCT.PRODUCT_NAME'),
          type: 'html',
          filter: true,
          editable: false
        },
        special: {
          title: this.translate.instant('PRODUCT.SPECIAL'),
          type: 'custom',
          renderComponent: SpecialToggleComponent,
          onComponentInitFunction: (instance) => {
            instance.changed.subscribe(product => this.specialChanged(product));
          },
          editable: false,
          filter: false,
          sort: false
        },
        quantity: {
          title: this.translate.instant('PRODUCT.QTY'),
          type: 'number',
          editable: true,
          filter: false
        },
        available: {
          filter: false,
          title: this.translate.instant('PRODUCT.ON_SITE'),
          type: 'custom',
          renderComponent: OnSiteToggleComponent,
          onComponentInitFunction: (instance) => {
            instance.changed.subscribe(product => this.onSiteChanged(product));
          },
          editable: false,
          sort: false
        },
        price: {
          title: this.translate.instant('PRODUCT.PRICE'),
          type: 'string',
          editable: true,
          filter: false
        },
        creationDate: {
          title: this.translate.instant('PRODUCT.CREATION_DATE'),
          type: 'string',
          editable: false,
          filter: false
        },
      },
    };
  }

  updateRecord(event) {
    const product = {
      available: event.newData.available,
      price: event.newData.price,
      quantity: event.newData.quantity
    };
    event.confirm.resolve(event.newData);
    this.productService.updateProductFromTable(event.newData.id, product)
      .subscribe(res => {
        event.confirm.resolve(event.newData);
        this.toastr.success(this.translate.instant('PRODUCT.PRODUCT_UPDATED'));
      }, error => {
        console.log(error.error.message);
      });
  }

  deleteRecord(event) {
    this.dialogService.open(ShowcaseDialogComponent, {})
      .onClose.subscribe(res => {
        if (res) {
          this.productService.deleteProduct(event.data.id)
            .subscribe(result => {
              this.toastr.success(this.translate.instant('PRODUCT.PRODUCT_REMOVED'));
              this.getList();
              // event.confirm.resolve();
            });
        } else {}
      });
  }

  choseStore(event) {
    this.params.store = event;
    this.getList();

  }

  // paginator
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
  route(e) {
    if (e.action === 'remove') {
      this.deleteRecord(e);
    } else if (e.action === 'copy') {
      this.duplicateRecord(e);
    } else {
      this.router.navigate(['pages/catalogue/products/product/' + e.data.id]);
    }
  }

  duplicateRecord(e) {
    this.loadingList = true;
    this.productService.duplicateProduct(e.data.id)
      .subscribe(created => {
        this.loadingList = false;
        this.toastr.success(this.translate.instant('PRODUCT.PRODUCT_COPIED'));
        this.router.navigate(['pages/catalogue/products/product/' + created.id]);
      }, err => {
        this.loadingList = false;
        this.toastr.error(this.translate.instant('PRODUCT.PRODUCT_COPY_FAILED'));
      });
  }
}
