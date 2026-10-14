import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'ngx-inventory-details',
  templateUrl: './inventory-details.component.html',
  styleUrls: ['./inventory-details.component.scss']
})
export class InventoryDetailsComponent implements OnInit {
  // `any`, not an inferred {}: the template reads inventory.id, and the
  // production build type-checks templates where the dev build does not
  inventory: any = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private inventoryService: InventoryService
  ) {
    const productId = this.activatedRoute.snapshot.paramMap.get('productId');
    const inventoryId = this.activatedRoute.snapshot.paramMap.get('inventoryId');
    this.inventoryService.getInventoryById(productId, inventoryId).subscribe((res) => {
      this.inventory = { ...res };
    });
  }

  ngOnInit() {
  }

}
