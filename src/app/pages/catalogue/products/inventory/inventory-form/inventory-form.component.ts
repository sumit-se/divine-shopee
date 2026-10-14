import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { StoreService } from '../../../../store-management/services/store.service';
import { ConfigService } from '../../../../shared/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { InventoryService } from '../../services/inventory.service';
import * as moment from 'moment';
import { validators } from '../../../../shared/validation/validators';
import { StorageService } from '../../../../shared/services/storage.service';

/**
 * One inventory record of a product: the stock held for it and what it costs.
 * A product has one of these for itself and one more for each of its variants.
 *
 * The screen never worked. It opened empty because fillForm() was commented
 * out, it had no quantity field at all, and what it did send on save was a
 * `priceDetails` group the inventory API has no field for -- so the prices were
 * dropped on the floor and the record came back unchanged. The payload built
 * here is the one the variant screen already saves successfully.
 */
@Component({
  selector: 'ngx-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss']
})
export class InventoryFormComponent implements OnInit {
  @Input() inventory;
  @Input() _title;
  form: FormGroup;
  stores = [];
  loader = false;
  languages = [];
  productId;
  // the price row being edited and its description, so a save updates them in
  // place instead of inserting a second price against the same record
  priceId = null;
  priceDescriptionId = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private translate: TranslateService,
    private storeService: StoreService,
    private configService: ConfigService,
    private activatedRoute: ActivatedRoute,
    private inventoryService: InventoryService,
    private storageService: StorageService
  ) {
  }

  ngOnInit() {
    this.productId = this.activatedRoute.snapshot.paramMap.get('productId');
    this.createForm();
    this.storeService.getListOfStores({})
      .subscribe(res => {
        res.data.forEach((store) => {
          this.stores.push({ value: store.code, label: store.code });
        });
      });
    this.loader = true;
    this.configService.getListOfSupportedLanguages(localStorage.getItem('merchant'))
      .subscribe(res => {
        this.languages = [...res];
        this.createForm();
        if (this.inventory && this.inventory.id) {
          this.fillForm();
        }
        this.loader = false;
      });
  }

  private createForm() {
    this.form = this.fb.group({
      available: [false],
      sku: [{ value: '', disabled: true }],
      quantity: [0, [Validators.required, Validators.pattern(validators.number)]],
      dateAvailable: [new Date()],
      // the logged-in merchant, not the demo store: this field is sent with the
      // inventory record, and 'DEFAULT' filed stock against the demo shop
      store: [this.storageService.getMerchant(), [Validators.required]],
      priceDetails: this.fb.group({
        originalPrice: ['', [Validators.required]],
        discountedPrice: [''],
        startDate: [''],
        endDate: [''],
      })
    });
  }

  fillForm() {
    const price = (this.inventory.prices && this.inventory.prices.length) ? this.inventory.prices[0] : null;
    this.priceId = price ? price.id : null;
    this.priceDescriptionId = price && price.description ? price.description.id : null;
    this.form.patchValue({
      available: !!this.inventory.available,
      // the record's own sku: the product's, or the variant's when it belongs to
      // one. Shown, not edited -- it follows whatever the record is attached to.
      sku: this.inventory.sku || '',
      quantity: this.inventory.quantity,
      dateAvailable: this.inventory.dateAvailable ? new Date(this.inventory.dateAvailable) : new Date(),
      store: (this.inventory.store && this.inventory.store.code) || this.storageService.getMerchant(),
      priceDetails: {
        // originalPrice is the list price; finalPrice only differs while
        // discounted, so an undiscounted record leaves the discount box empty
        originalPrice: this.toAmount(price ? price.originalPrice : this.inventory.price),
        discountedPrice: this.toAmount(price && price.discounted ? price.finalPrice : ''),
        startDate: price && price.discountStartDate ? new Date(price.discountStartDate) : '',
        endDate: price && price.discountEndDate ? new Date(price.discountEndDate) : '',
      }
    });
  }

  get priceDetails() { return this.form.get('priceDetails'); }
  get originalPrice() { return this.form.get('priceDetails.originalPrice'); }
  get discountedPrice() { return this.form.get('priceDetails.discountedPrice'); }
  get quantity() { return this.form.get('quantity'); }

  /**
   * Amounts come back formatted -- "₹39,000.00" -- with no numeric field beside
   * them, so the value shown in a number box has to be parsed back out.
   */
  private toAmount(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const numeric = Number(String(value).replace(/[^0-9.\-]/g, ''));
    return isNaN(numeric) ? '' : numeric;
  }

  private asDate(value) {
    return value ? moment(value).format('yyyy-MM-DD') : null;
  }

  private payload() {
    const value = this.form.getRawValue();
    const prices = value.priceDetails;
    const payload: any = {
      quantity: Number(value.quantity) || 0,
      region: '*',
      available: !!value.available,
      dateAvailable: this.asDate(value.dateAvailable),
      productQuantityOrderMin: this.inventory.productQuantityOrderMin || 1,
      productQuantityOrderMax: this.inventory.productQuantityOrderMax || 1,
      store: value.store,
      productId: Number(this.productId),
      prices: [{
        // ids of the rows being edited: without them the save inserts instead of
        // updating, and the price description hits its one-per-language unique
        // key
        id: this.priceId || undefined,
        code: 'base',
        defaultPrice: true,
        // without a description the mapper replaces the price's descriptions
        // with an empty set, wiping the one the price already had
        descriptions: [{
          id: this.priceDescriptionId || undefined,
          name: 'DEFAULT',
          language: this.storageService.getLanguage()
        }],
        price: Number(prices.originalPrice),
        discounted: !!prices.discountedPrice,
        discountedPrice: prices.discountedPrice ? Number(prices.discountedPrice) : null,
        discountStartDate: this.asDate(prices.startDate),
        discountEndDate: this.asDate(prices.endDate),
      }],
    };
    /*
     * `variant` is deliberately left out. The record already points at its
     * variant and the mapper only re-links when the field is sent, so omitting
     * it keeps a variant's stock attached to that variant.
     */
    return payload;
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toastr.error(this.translate.instant('COMMON.FILL_REQUIRED_FIELDS'));
      return;
    }
    const prices = this.form.getRawValue().priceDetails;
    // a "discount" at or above the list price would strike through the smaller
    // of the two and read as a price rise
    if (prices.discountedPrice && +prices.discountedPrice >= +prices.originalPrice) {
      this.toastr.error(this.translate.instant('PRICE.DISCOUNTED_PRICE') + ' < '
        + this.translate.instant('PRICE.ORIGINAL_PRICE'));
      return;
    }

    const inventoryObj = this.payload();
    this.loader = true;
    if (this.inventory && this.inventory.id) {
      inventoryObj.id = this.inventory.id;
      this.inventoryService.updateInventory(this.productId, this.inventory.id, inventoryObj)
        .subscribe(() => {
          this.loader = false;
          this.toastr.success(this.translate.instant('INVENTORY.INVENTORY_UPDATED'));
        }, err => {
          this.loader = false;
          this.toastr.error(err.error && err.error.message ? err.error.message : err.message);
        });
    } else {
      this.inventoryService.createInventory(this.productId, inventoryObj)
        .subscribe((res) => {
          this.loader = false;
          this.toastr.success(this.translate.instant('INVENTORY.INVENTORY_CREATED'));
          this.inventory = res;
        }, err => {
          this.loader = false;
          this.toastr.error(err.error && err.error.message ? err.error.message : err.message);
        });
    }
  }

}
