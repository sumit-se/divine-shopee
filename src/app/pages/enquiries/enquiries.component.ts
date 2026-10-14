import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { EnquiriesService } from './enquiries.service';

/**
 * Enquiries about products the store does not sell directly.
 *
 * The storefront saves them even when the notification email cannot be sent,
 * so this list -- not the mailbox -- is the reliable copy.
 */
@Component({
  selector: 'ngx-enquiries',
  templateUrl: './enquiries.component.html',
  styleUrls: ['./enquiries.component.scss']
})
export class EnquiriesComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  loadingList = false;
  settings = {};
  totalCount = 0;
  selected: any = null;

  constructor(
    private enquiriesService: EnquiriesService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.setSettings();
    this.load();
  }

  load() {
    this.loadingList = true;
    this.enquiriesService.getEnquiries().subscribe(res => {
      const rows = (res && res.enquiries) ? res.enquiries : [];
      this.source.load(rows);
      this.totalCount = res && res.recordsTotal ? res.recordsTotal : rows.length;
      this.loadingList = false;
    }, error => {
      this.loadingList = false;
      this.source.load([]);
      this.toastr.error(error && error.error ? error.error.message : error);
    });
  }

  setSettings() {
    this.settings = {
      actions: {
        columnTitle: this.translate.instant('ORDER.ACTIONS'),
        add: false,
        edit: false,
        delete: false,
        position: 'right',
        custom: [{ name: 'view', title: '<i class="nb-edit"></i>' }]
      },
      pager: { display: true, perPage: 20 },
      columns: {
        id: { title: this.translate.instant('COMMON.ID'), type: 'number', width: '70px' },
        dateCreated: { title: this.translate.instant('ORDER.ORDER_DATE'), type: 'string' },
        productName: { title: this.translate.instant('ENQUIRIES.PRODUCT'), type: 'string' },
        productSku: { title: this.translate.instant('PRODUCT.SKU'), type: 'string' },
        customerName: { title: this.translate.instant('ORDER.CUSTOMER_NAME'), type: 'string' },
        customerEmail: { title: this.translate.instant('ORDER.CUSTOMER_EMAIL'), type: 'string' },
        customerPhone: { title: this.translate.instant('ORDER.CUSTOMER_PHONE'), type: 'string' },
        status: { title: this.translate.instant('ORDER.STATUS'), type: 'string', width: '100px' }
      }
    };
  }

  /** The message is too long for a table cell; it opens beside the list. */
  onAction(event) {
    this.selected = event.data;
  }

  closeDetails() {
    this.selected = null;
  }

  setStatus(enquiry, status) {
    this.enquiriesService.setStatus(enquiry.id, status).subscribe(() => {
      this.toastr.success(this.translate.instant('ENQUIRIES.STATUS_UPDATED'));
      this.selected = null;
      this.load();
    }, error => {
      this.toastr.error(error && error.error ? error.error.message : error);
    });
  }
}
