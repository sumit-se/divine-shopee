import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product: any = {};
  loading: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private router: Router,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit() {
    this.loading = true;
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.productService.getProductById(id)
      .subscribe(
        res => {
          this.product = res;
          this.loading = false;
        },
        _err => {
          this.loading = false;
          this.toastr.error(this.translate.instant('COMMON.ERROR'));
          this.router.navigate(['pages/catalogue/products/products-list']);
        }
      );
  }

  route(link) {
    this.router.navigate(['pages/catalogue/products/' + this.product.sku + '/' + link]);
  }

}
