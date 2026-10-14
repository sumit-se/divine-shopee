import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

import { ProductVariantService } from '../../services/product-variant.service';
import { ProductService } from '../../services/product.service';
import { VariationService } from '../../../options/services/variation.service';
import { StorageService } from '../../../../shared/services/storage.service';
import { validators } from '../../../../shared/validation/validators';
import { ShowcaseDialogComponent } from '../../../../shared/components/showcase-dialog/showcase-dialog.component';

/**
 * Create or edit one variant of a product.
 *
 * Two records are behind this form:
 *
 *  - the variant itself (sku, the variation it stands for, availability dates,
 *    ordering), saved through the variant API
 *  - its inventory (stock, price, discount), saved through the inventory API,
 *    since that is where Shopizer keeps stock and price for a variant
 *
 * Saving does both, in that order: a new variant has to exist before its
 * inventory can point at it.
 *
 * Images are the variant's own, saved straight away through their own API
 * (not with the Save button), so they need a variant that already exists. On
 * the storefront they replace the product's gallery while the variant is chosen.
 *
 * Not offered here, because the backend has no support for it:
 *  - a description. ProductVariant carries no descriptions at all; the text on
 *    a product page comes from the product.
 *
 * Dimensions (weight, width, height, length) are the variant's own and each is
 * optional: a blank one means shipping uses the product's value, which the
 * field shows as its placeholder.
 */
@Component({
  selector: 'ngx-variant-form',
  templateUrl: './variant-form.component.html',
  styleUrls: ['./variant-form.component.scss']
})
export class VariantFormComponent implements OnInit {

  productId: any;
  variantId: any;

  form: FormGroup;
  loading = false;
  variations = [];
  variationsLoaded = false;

  // the variant's existing inventory record, when it has one
  inventoryId: any = null;
  // and the price row and its description, so a save updates them in place
  priceId: any = null;
  priceDescriptionId: any = null;
  images = [];
  uploadingImages = false;
  // the product's own dimensions, shown as what a blank field falls back to
  productDimensions: any = {};
  dimensionFields = ['weight', 'width', 'height', 'length'];

  constructor(
    private fb: FormBuilder,
    private productVariantService: ProductVariantService,
    private productService: ProductService,
    private variationService: VariationService,
    private storageService: StorageService,
    private toastr: ToastrService,
    private translate: TranslateService,
    protected ref: NbDialogRef<VariantFormComponent>,
    private dialogService: NbDialogService
  ) {
    // built here rather than in ngOnInit so the template can never bind
    // [formGroup] to an undefined value on the dialog's first render
    this.createForm();
  }

  ngOnInit() {
    // the endpoint defaults to 10 per page; a store can easily have more
    this.variationService.getListOfVariations({ count: 200, page: 0 }).subscribe(res => {
      const items = (res && res.items) ? res.items : [];
      this.variations = items.map(variation => {
        const option = variation.option || {};
        const value = variation.optionValue || {};
        // the name sits on the entity for some endpoints and under
        // `description` for others; the code is the last resort
        const optionName = option.name || (option.description && option.description.name) || option.code || '';
        const valueName = value.name || (value.description && value.description.name) || value.code || '';
        const label = optionName && valueName ? optionName + ': ' + valueName : (valueName || optionName);
        return {
          value: variation.id,
          label: label || variation.code
        };
      });
      this.variationsLoaded = true;
    }, () => {
      // a failed lookup should not leave the dialog looking empty and silent
      this.variationsLoaded = true;
      this.toastr.error(this.translate.instant('PRODUCT_VARIANTS.NO_VARIATIONS'));
    });

    this.productService.getProductById(this.productId).subscribe(product => {
      this.productDimensions = (product && product.productSpecifications) || {};
    }, () => {
      // placeholders only; the form works without them
    });

    if (this.variantId) {
      this.loading = true;
      this.productVariantService.getVariantById(this.productId, this.variantId, {})
        .subscribe(variant => {
          this.fillForm(variant);
          this.loading = false;
        }, error => {
          this.loading = false;
          const message = error && error.error && error.error.message
            ? error.error.message
            : this.translate.instant('COMMON.SOMETHING_WRONG');
          this.toastr.error(message);
        });
    }
  }

  createForm() {
    this.form = this.fb.group({
      // variant
      sku: ['', [Validators.required, Validators.pattern(validators.alphanumeric)]],
      variation: ['', [Validators.required]],
      variationValue: [''],
      dateAvailable: [new Date()],
      sortOrder: [0],
      available: [true],
      defaultSelection: [false],
      // inventory
      quantity: [1, [Validators.pattern(validators.number)]],
      price: ['', [Validators.required]],
      discountedPrice: [''],
      discountStartDate: [''],
      discountEndDate: [''],
      quantityOrderMin: [1, [Validators.pattern(validators.number)]],
      quantityOrderMax: [1, [Validators.pattern(validators.number)]],
      // dimensions: blank = use the product's
      weight: ['', [Validators.min(0)]],
      width: ['', [Validators.min(0)]],
      height: ['', [Validators.min(0)]],
      length: ['', [Validators.min(0)]],
    });
  }

  fillForm(variant) {
    const inventory = (variant.inventory && variant.inventory.length) ? variant.inventory[0] : null;
    const price = inventory && inventory.prices && inventory.prices.length ? inventory.prices[0] : null;
    // originalPrice is the list price; finalPrice only differs while discounted
    const listPrice = price ? price.originalPrice : (inventory ? inventory.price : '');
    const discounted = price && price.discounted ? price.finalPrice : '';
    this.inventoryId = inventory ? inventory.id : null;
    this.priceId = price ? price.id : null;
    this.priceDescriptionId = price && price.description ? price.description.id : null;
    this.images = variant.images || [];

    this.form.patchValue({
      sku: variant.sku,
      variation: variant.variation ? variant.variation.id : '',
      variationValue: variant.variationValue ? variant.variationValue.id : '',
      dateAvailable: variant.dateAvailable ? new Date(variant.dateAvailable) : new Date(),
      sortOrder: variant.sortOrder || 0,
      available: variant.available,
      defaultSelection: variant.defaultSelection,
      quantity: inventory ? inventory.quantity : 1,
      price: this.toAmount(listPrice),
      discountedPrice: this.toAmount(discounted),
      // the API returns these as yyyy-MM-dd once a discount window is set
      discountStartDate: price && price.discountStartDate ? new Date(price.discountStartDate) : '',
      discountEndDate: price && price.discountEndDate ? new Date(price.discountEndDate) : '',
      quantityOrderMin: inventory ? inventory.productQuantityOrderMin : 1,
      quantityOrderMax: inventory ? inventory.productQuantityOrderMax : 1,
      weight: this.dimension(variant, 'weight'),
      width: this.dimension(variant, 'width'),
      height: this.dimension(variant, 'height'),
      length: this.dimension(variant, 'length'),
    });
  }

  get sku() { return this.form.get('sku'); }
  get variation() { return this.form.get('variation'); }
  get price() { return this.form.get('price'); }

  /**
   * The readable price is a formatted string -- "₹39,000.00" -- and carries no
   * numeric field, so the value shown in the admin has to be parsed back out of
   * it. Reading `prices[0].price` (which does not exist on that payload) is what
   * left the price box empty.
   */
  private toAmount(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const numeric = Number(String(value).replace(/[^0-9.\-]/g, ''));
    return isNaN(numeric) ? '' : numeric;
  }

  private dimension(variant, field) {
    const value = variant.productSpecifications ? variant.productSpecifications[field] : null;
    return value === null || value === undefined ? '' : value;
  }

  // '' and null go out as null, so the variant falls back to the product
  private dimensionValue(value) {
    return value === '' || value === null || value === undefined ? null : Number(value);
  }

  productDimensionPlaceholder(field) {
    const value = this.productDimensions[field];
    return value === null || value === undefined
      ? this.translate.instant('PRODUCT_VARIANTS.SAME_AS_PRODUCT')
      : this.translate.instant('PRODUCT_VARIANTS.PRODUCT_VALUE', { value });
  }

  private asDate(value) {
    return value ? moment(value).format('yyyy-MM-DD') : null;
  }

  private inventoryPayload(variantId) {
    const value = this.form.value;
    const payload: any = {
      quantity: Number(value.quantity) || 0,
      variant: variantId,
      region: '*',
      available: !!value.available,
      dateAvailable: this.asDate(value.dateAvailable),
      productQuantityOrderMin: Number(value.quantityOrderMin) || 1,
      productQuantityOrderMax: Number(value.quantityOrderMax) || 1,
      prices: [{
        // ids of the rows being edited: without them the save inserts instead of
        // updating, and the price description hits its one-per-language unique
        // key ("Duplicate entry '901-1'")
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
        price: Number(value.price),
        discounted: !!value.discountedPrice,
        discountedPrice: value.discountedPrice ? Number(value.discountedPrice) : null,
        discountStartDate: this.asDate(value.discountStartDate),
        discountEndDate: this.asDate(value.discountEndDate),
      }],
    };
    if (this.inventoryId) {
      payload.id = this.inventoryId;
    }
    return payload;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error(this.translate.instant('COMMON.FILL_REQUIRED'));
      return;
    }

    const value = this.form.value;
    const variantPayload: any = {
      sku: value.sku,
      variation: value.variation,
      sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
      available: !!value.available,
      defaultSelection: !!value.defaultSelection,
      dateAvailable: this.asDate(value.dateAvailable),
      productId: this.productId,
      productSpecifications: {
        weight: this.dimensionValue(value.weight),
        width: this.dimensionValue(value.width),
        height: this.dimensionValue(value.height),
        length: this.dimensionValue(value.length),
      },
    };
    if (value.variationValue) {
      variantPayload.variationValue = value.variationValue;
    }

    this.loading = true;
    const saveVariant = this.variantId
      ? this.productVariantService.updateVariant(this.productId, this.variantId, variantPayload)
      : this.productVariantService.createVariant(this.productId, variantPayload);

    saveVariant.subscribe(res => {
      // create returns the new id; update returns nothing
      const variantId = this.variantId || (res && (res.id || res));
      this.saveInventory(variantId);
    }, error => {
      this.loading = false;
      this.showError(error);
    });
  }

  private saveInventory(variantId) {
    const payload = this.inventoryPayload(variantId);
    const saveStock = this.inventoryId
      ? this.productVariantService.updateInventory(this.productId, this.inventoryId, payload)
      : this.productVariantService.createInventory(this.productId, payload);

    saveStock.subscribe(() => {
      this.loading = false;
      this.toastr.success(this.translate.instant(this.variantId
        ? 'PRODUCT_VARIANTS.VARIANT_UPDATED'
        : 'PRODUCT_VARIANTS.VARIANT_CREATED'));
      this.ref.close(true);
    }, error => {
      this.loading = false;
      // the variant itself saved; say so rather than implying nothing happened
      this.toastr.warning(this.translate.instant('PRODUCT_VARIANTS.STOCK_NOT_SAVED'));
      this.showError(error);
      this.ref.close(true);
    });
  }

  private showError(error) {
    const message = error && error.error && error.error.message
      ? error.error.message
      : this.translate.instant('COMMON.SOMETHING_WRONG');
    this.toastr.error(message);
  }

  onImagesSelected(event) {
    const input = event.target;
    const files: File[] = Array.from(input.files || []);
    input.value = '';
    if (!files.length) {
      return;
    }
    this.uploadingImages = true;
    // one at a time, so the first picked becomes the main image of a variant
    // that has none yet
    const next = (i) => {
      if (i >= files.length) {
        this.uploadingImages = false;
        return;
      }
      this.productVariantService.addVariantImage(this.productId, this.variantId, files[i])
        .subscribe(images => {
          this.images = images || [];
          next(i + 1);
        }, error => {
          this.uploadingImages = false;
          this.showError(error);
        });
    };
    next(0);
  }

  makeMainImage(image) {
    this.productVariantService.setMainVariantImage(this.productId, this.variantId, image.id)
      .subscribe(images => this.images = images || [], error => this.showError(error));
  }

  removeImage(image) {
    this.dialogService.open(ShowcaseDialogComponent, {
      context: {
        title: '',
        actionText: this.translate.instant('PRODUCT_VARIANTS.REMOVE_IMAGE'),
        text: ''
      }
    }).onClose.subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.productVariantService.removeVariantImage(this.productId, this.variantId, image.id)
        .subscribe(images => this.images = images || [], error => this.showError(error));
    });
  }

  goToback() {
    this.ref.close();
  }
}
