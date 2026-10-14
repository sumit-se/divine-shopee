import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { NbDialogService } from '@nebular/theme';

import { CrudService } from '../../../shared/services/crud.service';
import { ProductService } from '../services/product.service';
import { ShowcaseDialogComponent } from '../../../shared/components/showcase-dialog/showcase-dialog.component';

/**
 * Shoppers waiting for this product ("Notify me when available" on the shop,
 * StockAlertApi). They are emailed by themselves once the product can be
 * bought again -- the backend checks every 15 minutes -- and "Notify now" does
 * it straight away after stock has been added.
 */
@Component({
  selector: 'ngx-product-stock-alerts',
  templateUrl: './stock-alerts.component.html',
  styleUrls: ['./stock-alerts.component.scss']
})
export class ProductStockAlertsComponent implements OnInit {
  id: any;
  loading = false;
  inStock = false;
  waiting: any[] = [];

  constructor(
    private crudService: CrudService,
    private productService: ProductService,
    private router: Router,
    private location: Location,
    private toastr: ToastrService,
    private translate: TranslateService,
    private dialogService: NbDialogService,
  ) {
  }

  ngOnInit() {
    this.id = this.productService.getProductIdRoute(this.router, this.location);
    this.load();
  }

  load() {
    this.loading = true;
    this.crudService.get(`/v1/private/product/${this.id}/stock-alerts`)
      .subscribe(res => {
        this.inStock = !!(res && res.inStock);
        this.waiting = (res && res.waiting) || [];
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  notifyNow() {
    this.loading = true;
    this.crudService.post(`/v1/private/product/${this.id}/stock-alerts/notify`, {})
      .subscribe(res => {
        const sent = res && res.sent !== undefined ? res.sent : 0;
        const failed = this.waiting.length - sent;
        if (sent > 0) {
          this.toastr.success(this.translate.instant('STOCK_ALERTS.SENT', { count: sent }));
        }
        // the emails that did not go stay on the list and are retried by the
        // 15-minute check; a failure is almost always the mail account settings
        if (failed > 0) {
          this.toastr.warning(this.translate.instant('STOCK_ALERTS.NOT_SENT', { count: failed }), '', { timeOut: 10000 });
        }
        this.load();
      }, error => {
        this.loading = false;
        this.toastr.error(error && error.error && error.error.message
          ? error.error.message
          : this.translate.instant('COMMON.SOMETHING_WRONG'));
      });
  }

  remove(row) {
    this.dialogService.open(ShowcaseDialogComponent, {
      context: { title: '', actionText: this.translate.instant('STOCK_ALERTS.REMOVE_CONFIRM'), text: row.email + ' ?' }
    }).onClose.subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.crudService.delete(`/v1/private/stock-alert/${row.id}`)
        .subscribe(() => this.load(), error => this.toastr.error(error && error.error ? error.error.message : error));
    });
  }
}
