import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../shared/services/storage.service';
import { ShowcaseDialogComponent } from '../../shared/components/showcase-dialog/showcase-dialog.component';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'ngx-cart-details',
  templateUrl: './cart-details.component.html',
  styleUrls: ['./cart-details.component.scss']
})
export class CartDetailsComponent implements OnInit {
  cart: any;
  loading = false;
  notFound = false;
  private store: string;

  constructor(
    private ordersService: OrdersService,
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private dialogService: NbDialogService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    // a superadmin may have picked another store on the list
    this.store = this.route.snapshot.queryParamMap.get('store') || this.storageService.getMerchant();
    const params = {
      store: this.store,
      lang: this.storageService.getLanguage()
    };

    this.loading = true;
    this.ordersService.getCartDetails(id, params)
      .subscribe(cart => {
        this.loading = false;
        this.cart = cart;
      }, () => {
        this.loading = false;
        this.notFound = true;
      });
  }

  goToOrder() {
    localStorage.setItem('orderID', this.cart.orderId);
    this.router.navigate(['pages/orders/order-details']);
  }

  deleteCart() {
    this.dialogService.open(ShowcaseDialogComponent, {
      context: {
        title: '',
        actionText: this.translate.instant('CART.DELETE_CONFIRM'),
        text: '#' + this.cart.id + ' ?'
      }
    }).onClose.subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.loading = true;
      this.ordersService.deleteCart(this.cart.id, { store: this.store })
        .subscribe(() => {
          this.loading = false;
          this.toastr.success(this.translate.instant('CART.DELETED'));
          this.back();
        }, () => {
          this.loading = false;
          this.toastr.error(this.translate.instant('CART.DELETE_FAILED'));
        });
    });
  }

  back() {
    this.router.navigate(['pages/orders/cart-list']);
  }

}
