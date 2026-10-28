import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../../../shared/services/config.service';
import { InventoryService } from '../../services/inventory.service';
import { slugify } from '../../../../shared/utils/slugifying';
import { Location } from '@angular/common';

@Component({
  selector: 'ngx-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.scss']
})
export class PriceFormComponent implements OnInit {
  price;
  priceId;
  id : any;
  form: FormGroup;
  loader = false;
  languages = [];
  prices = [];
  config = {
    placeholder: '',
    tabsize: 2,
    height: 300,
    uploadImagePath: '',
    toolbar: [
      ['misc', ['codeview', 'undo', 'redo']],
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
      ['fontsize', ['fontname', 'fontsize', 'color']],
      ['para', ['style', 'ul', 'ol', 'paragraph', 'height']],
      ['insert', ['table', 'picture', 'link', 'video', 'hr']]
    ],
    fontNames: ['Helvetica', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Roboto', 'Times']
  };
  inventory;
  params = {
    productId: '',
    inventoryId: ''
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private location: Location,
    private translate: TranslateService,
    private productService: ProductService,
    private configService: ConfigService,
    private inventoryService: InventoryService
  ) {
  }

  ngOnInit() {



    this.params.productId = this.activatedRoute.snapshot.paramMap.get('productId');
    this.params.inventoryId = this.activatedRoute.snapshot.paramMap.get('inventoryId');
    this.priceId = +this.activatedRoute.snapshot.paramMap.get('priceId');
    this.createForm();
    this.loader = true;
    this.inventoryService.getInventoryById(this.params.productId, this.params.inventoryId)
      .subscribe(res => {
        this.inventory = res;
        this.configService.getListOfSupportedLanguages(localStorage.getItem('merchant'))
          .subscribe(ln => {
            this.languages = [...ln];
            this.addFormArray();
            if (this.priceId) {
              this.price = this.inventory.prices.find((r) => r.id && r.id === this.priceId);
              this.fillForm();
            }
            this.loader = false;
          });
      });
  }

  transformTotal() {
    // no-op: price fields are type="number", no currency formatting needed here
  }

  /** Strip currency symbol and commas to get a plain number */
  private stripCurrency(val: string | number): number {
    if (typeof val === 'number') return val;
    return parseFloat(('' + val).replace(/[^\d.]/g, '')) || 0;
  }

  /** Convert a ReadableProductPrice (from GET) to the shape PersistableProductPrice (for PUT) expects */
  private toPersistedPrice(el: any): any {
    return {
      id: el.id,
      code: el.code || 'DEFAULT',
      defaultPrice: el.defaultPrice,
      discounted: el.discounted,
      price: this.stripCurrency(el.originalPrice || '0'),
      discountedPrice: el.discounted ? this.stripCurrency(el.finalPrice || '0') : null,
      discountStartDate: el.discountStartDate || null,
      discountEndDate: el.discountEndDate || null,
      descriptions: el.descriptions || (el.description ? [el.description] : []),
    };
  }

  private createForm() {
    this.form = this.fb.group({
      finalPrice: ['', [Validators.required]],
      originalPrice: ['', [Validators.required]],
      discountedPrice: [''],
      discounted: ['', [Validators.required]],
      selectedLanguage: ['', [Validators.required]],
      descriptions: this.fb.array([]),
    });
  }

  addFormArray() {
    const control = <FormArray>this.form.controls.descriptions;
    this.languages.forEach(lang => {
      control.push(
        this.fb.group({
          language: [lang.code, [Validators.required]],
          name: ['', [Validators.required]],
          highlights: [''],
          friendlyUrl: ['', [Validators.required]],
          description: [''],
          title: [''],
          keyWords: [''],
          metaDescription: [''],
        })
      );
    });
  }

  fillForm() {
    // originalPrice = the list/regular price (always set)
    // finalPrice    = discounted amount when discounted==true, else same as originalPrice
    const sliceNum = (s: string) => s ? s.replace(/[^\d.]/g, '') : '';
    this.form.patchValue({
      originalPrice: sliceNum(this.price.originalPrice),
      finalPrice: sliceNum(this.price.finalPrice),
      discountedPrice: this.price.discounted ? sliceNum(this.price.finalPrice) : '',
      discounted: this.price.discounted,
      descriptions: [],
      selectedLanguage: 'en',
    });
    this.fillFormArray();
  }

  fillFormArray() {
    // ReadableProductPrice has `description` (single) or `descriptions` (array, full mode)
    const descList: any[] = this.price.descriptions
      ? this.price.descriptions
      : (this.price.description ? [this.price.description] : []);

    this.form.value.descriptions.forEach((desc, index) => {
      descList.forEach((description) => {
        if (desc.language === description.language) {
          (<FormArray>this.form.get('descriptions')).at(index).patchValue({
            language: description.language,
            name: description.name || '',
            highlights: description.highlights || '',
            friendlyUrl: description.friendlyUrl || '',
            description: description.description || '',
            title: description.title || '',
            keyWords: description.keyWords || '',
            metaDescription: description.metaDescription || '',
          });
        }
      });
    });
  }

  get selectedLanguage() {
    return this.form.get('selectedLanguage');
  }

  get descriptions(): FormArray {
    return <FormArray>this.form.get('descriptions');
  }

  changeName(event, index) {
    (<FormArray>this.form.get('descriptions')).at(index).patchValue({
      friendlyUrl: slugify(event)
    });
  }

  save() {
    const formValue = this.form.value;

    // PRODUCT_PRICE_DESCRIPTION has no FRIENDLY_URL column; auto-generate it from
    // name so existing prices (which never stored a friendlyUrl) can be saved.
    const descriptions = (formValue.descriptions || []).map((el: any) => ({
      ...el,
      friendlyUrl: el.friendlyUrl || slugify(el.name || ''),
    }));

    // Validate: at least one description must have a name
    const firstName = descriptions.find((el: any) => el.name);
    if (!firstName) {
      this.toastr.error(this.translate.instant('COMMON.FILL_REQUIRED_FIELDS'));
      return;
    }

    // Build the PersistableProductPrice payload from the form.
    // Backend expects `price` (BigDecimal) — NOT `finalPrice`/`originalPrice`.
    const newPrice: any = {
      defaultPrice: true,
      discounted: formValue.discounted || false,
      price: this.stripCurrency(formValue.originalPrice) || this.stripCurrency(formValue.finalPrice),
      discountedPrice: formValue.discountedPrice ? this.stripCurrency(formValue.discountedPrice) : null,
      code: (this.price && this.price.code) ? this.price.code : 'DEFAULT',
      descriptions,
    };
    if (this.priceId && this.price) {
      newPrice.id = this.price.id;
    }

    // Build the prices array: replace the edited price or append if new
    let prices: any[];
    if (this.priceId) {
      prices = (this.inventory.prices || []).map((el) =>
        el.id === this.priceId ? newPrice : this.toPersistedPrice(el)
      );
    } else {
      prices = [
        ...(this.inventory.prices || []).map(el => this.toPersistedPrice(el)),
        newPrice,
      ];
    }

    // Build the full PersistableInventory payload.
    // `productId` is @NotNull on the backend — must be included in the body.
    const store = this.inventory.store;
    const inventoryPayload: any = {
      productId: parseInt(this.params.productId, 10),
      store: (store && store.code) ? store.code : store,
      quantity: this.inventory.quantity,
      region: this.inventory.region,
      regionVariant: this.inventory.regionVariant,
      owner: this.inventory.owner,
      dateAvailable: this.inventory.dateAvailable,
      available: this.inventory.available,
      productQuantityOrderMin: this.inventory.productQuantityOrderMin,
      productQuantityOrderMax: this.inventory.productQuantityOrderMax,
      prices,
    };

    this.loader = true;
    this.inventoryService.updateInventory(this.params.productId, this.inventory.id, inventoryPayload)
      .subscribe(() => {
        this.loader = false;
        this.toastr.success(this.translate.instant('PRODUCT.PRODUCT_UPDATED'));
        this.location.back();
      }, (err) => {
        this.loader = false;
        this.toastr.error((err.error && err.error.message) ? err.error.message : this.translate.instant('COMMON.ERROR'));
      });
  }

}
