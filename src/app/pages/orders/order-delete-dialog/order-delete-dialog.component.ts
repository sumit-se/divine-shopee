import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

/**
 * Confirms an order deletion. Closes with { restock } when confirmed, nothing
 * when dismissed.
 */
@Component({
  selector: 'ngx-order-delete-dialog',
  templateUrl: './order-delete-dialog.component.html',
  styleUrls: ['./order-delete-dialog.component.scss'],
})
export class OrderDeleteDialogComponent implements OnInit {
  @Input() orderId: number;
  @Input() status: string;
  restock = true;

  constructor(protected ref: NbDialogRef<OrderDeleteDialogComponent>) {
  }

  ngOnInit() {
    // placing an order takes its items out of stock and nothing puts them
    // back (not even cancel or refund); only delivered goods are really gone
    this.restock = this.status !== 'DELIVERED';
  }

  dismiss() {
    this.ref.close();
  }

  confirm() {
    this.ref.close({ restock: this.restock });
  }
}
