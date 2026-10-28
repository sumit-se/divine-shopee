import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { validators } from '../../../shared/validation/validators';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';


@Component({
  selector: 'ngx-product-discount',
  templateUrl: './product-discount.component.html',
  styleUrls: ['./product-discount.component.scss']
})
export class ProductDiscountComponent implements OnInit {
  discountForm: FormGroup;
  id : any;
  loading: false;

  constructor(
    private dfb: FormBuilder,
    private location: Location,   
    private productService: ProductService,
    private router: Router,
    ) { }

  ngOnInit(): void {
    
    this.id = this.productService.getProductIdRoute(this.router,this.location);

    //scroll down to discount tab
    let el = document.getElementById('tabs');
    el.scrollIntoView();

    //get product price

    this.discountForm = this.dfb.group({
      discountedPrice: [Validators.pattern(validators.number)],
      percentageOff: [Validators.pattern(validators.number)],
      rebatePrice: [Validators.required, Validators.pattern(validators.number)],
      memberExclusivePrice: [{ value: '', disabled: true }],
      timeBound: [false],
      startDate: [new Date()],
      endDate: [new Date()],
      discountedRadio: [null],
      percentageOffRadio: [null],
      rebateRadio: [null],
      memberExclusiveRadio: [null]
    })
  }

  save() { 


  }

  discountSelected(e) {
    if (e == 1) {
      this.discountForm.controls['discountedPrice'].setValidators([Validators.required]);
      // this.discountForm.controls['discountedPrice'].setValue([Validators.pattern(validators.)]);
    }
    else {
      this.discountForm.controls['discountedRadio'].updateValueAndValidity()
      this.discountForm.controls['discountedPrice'].clearValidators();
    }
  }
  percentageSelected(e) {
    if (e == 2) {
      this.discountForm.controls['percentageOff'].setValidators([Validators.required]);
    }
    else {
      this.discountForm.controls['percentageOffRadio'].updateValueAndValidity()
      this.discountForm.controls['percentageOff'].clearValidators();
    }
  }
  rebateSelected(e) {
    if (e == 3) {
      this.discountForm.controls['rebatePrice'].setValidators([Validators.required]);
    }
    else {
      this.discountForm.controls['rebateRadio'].updateValueAndValidity()
      this.discountForm.controls['rebatePrice'].clearValidators();
    }
  }

  memberExclusiveSelected(e) {
    if (e == 4) {
      this.discountForm.controls['memberExclusiveRadio'].updateValueAndValidity();
      // Clear other discount type selections
      this.discountForm.controls['discountedRadio'].setValue(null);
      this.discountForm.controls['percentageOffRadio'].setValue(null);
      this.discountForm.controls['rebateRadio'].setValue(null);
      this.discountForm.controls['discountedPrice'].clearValidators();
      this.discountForm.controls['percentageOff'].clearValidators();
      this.discountForm.controls['rebatePrice'].clearValidators();
      // Auto-compute 5% discount from original price if available
      const originalPrice = this.discountForm.controls['discountedPrice'].value;
      if (originalPrice) {
        const memberPrice = (parseFloat(originalPrice) * 0.95).toFixed(2);
        this.discountForm.controls['memberExclusivePrice'].setValue(memberPrice);
      }
    } else {
      this.discountForm.controls['memberExclusiveRadio'].updateValueAndValidity();
      this.discountForm.controls['memberExclusivePrice'].setValue('');
    }
  }
}
