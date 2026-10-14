import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocalDataSource } from 'ng2-smart-table';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { ToastrService } from 'ngx-toastr';
import { ShowcaseDialogComponent } from '../../shared/components/showcase-dialog/showcase-dialog.component';
import { StorageService } from '../../shared/services/storage.service';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'ngx-cart-list',
  templateUrl: './cart-list.component.html',
  styleUrls: ['../order-list/order-list.component.scss', './cart-list.component.scss']
})
export class CartListComponent implements OnInit, OnDestroy {
  source: LocalDataSource = new LocalDataSource();
  loadingList = false;
  settings = {};
  isSuperAdmin: boolean;
  // paginator
  perPage = 20;
  currentPage = 1;
  totalCount;
  // ACTIVE: not yet turned into an order, ORDERED: checked out, ALL: both
  status = 'ACTIVE';
  statuses = ['ACTIVE', 'ORDERED', 'ALL'];
  params = this.loadParams();
  private langSubscription: Subscription;

  constructor(
    private ordersService: OrdersService,
    private router: Router,
    private translate: TranslateService,
    private storageService: StorageService,
    private dialogService: NbDialogService,
    private toastr: ToastrService,
  ) {
    this.isSuperAdmin = this.storageService.getUserRoles().isSuperadmin;
  }

  ngOnInit() {
    this.getCartList();
    this.langSubscription = this.translate.onLangChange.subscribe(() => {
      this.params.lang = this.storageService.getLanguage();
      this.getCartList();
    });
  }

  ngOnDestroy() {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  loadParams() {
    return {
      store: this.storageService.getMerchant(),
      lang: this.storageService.getLanguage(),
      status: this.status,
      count: this.perPage,
      page: 0
    };
  }

  getCartList() {
    // the paginator counts pages from 1, the API from 0
    this.params.page = this.currentPage - 1;
    this.params.status = this.status;

    this.loadingList = true;
    this.ordersService.getCarts(this.params)
      .subscribe(res => {
        this.loadingList = false;
        this.source.load(res.carts || []);
        this.totalCount = res.recordsTotal;
      }, () => {
        this.loadingList = false;
        this.source.load([]);
        this.totalCount = 0;
      });
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
        custom: [
          {
            name: 'view',
            title: '<i class="nb-edit"></i>'
          },
          {
            name: 'remove',
            title: '<i class="nb-trash"></i>'
          }
        ],
      },
      hideSubHeader: true,
      pager: {
        display: false
      },
      columns: {
        id: {
          title: this.translate.instant('COMMON.ID'),
          type: 'number',
        },
        customerName: {
          title: this.translate.instant('CART.CUSTOMER'),
          type: 'string',
          valuePrepareFunction: (name, cart) => {
            if (!cart.customerId) {
              return this.translate.instant('CART.GUEST');
            }
            return name || ('#' + cart.customerId);
          }
        },
        customerEmail: {
          title: this.translate.instant('ORDER.CUSTOMER_EMAIL'),
          type: 'string',
          valuePrepareFunction: (email) => email || '',
        },
        itemCount: {
          title: this.translate.instant('CART.ITEMS'),
          type: 'number',
        },
        dateModified: {
          title: this.translate.instant('CART.LAST_MODIFIED'),
          type: 'string',
        },
        status: {
          title: this.translate.instant('ORDER.STATUS'),
          type: 'string',
          valuePrepareFunction: (status, cart) => {
            const label = this.translate.instant('CART.' + status);
            return cart.orderId ? label + ' (#' + cart.orderId + ')' : label;
          }
        }
      },
    };
  }

  onStatusChange(status) {
    this.status = status;
    this.currentPage = 1;
    this.getCartList();
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
    this.getCartList();
  }

  onSelectStore(e) {
    // p-autoComplete hands back the store code itself; see OrderListComponent
    this.params.store = (e && e.value) ? e.value : e;
    this.currentPage = 1;
    this.getCartList();
  }

  route(e) {
    if (e.action === 'remove') {
      this.deleteCart(e.data);
      return;
    }
    this.router.navigate(['pages/orders/cart-details', e.data.id], { queryParams: { store: this.params.store } });
  }

  deleteCart(cart) {
    this.dialogService.open(ShowcaseDialogComponent, {
      context: {
        title: '',
        actionText: this.translate.instant('CART.DELETE_CONFIRM'),
        text: '#' + cart.id + ' ?'
      }
    }).onClose.subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.loadingList = true;
      this.ordersService.deleteCart(cart.id, { store: this.params.store })
        .subscribe(() => {
          this.toastr.success(this.translate.instant('CART.DELETED'));
          this.getCartList();
        }, () => {
          this.loadingList = false;
          this.toastr.error(this.translate.instant('CART.DELETE_FAILED'));
        });
    });
  }

}
