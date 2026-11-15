import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { BrandService } from '../services/brand.service';

@Component({
  selector: 'ngx-brand-details',
  templateUrl: './brand-details.component.html',
  styleUrls: ['./brand-details.component.scss']
})
export class BrandDetailsComponent implements OnInit {
  brand: any = {};
  loading = false;

  constructor(
    private brandService: BrandService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit() {
    this.loading = true;
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.brandService.getBrandById(id)
      .subscribe(
        brand => {
          this.brand = brand;
          this.loading = false;
        },
        _err => {
          this.loading = false;
          this.toastr.error(this.translate.instant('COMMON.ERROR'));
          this.router.navigate(['pages/catalogue/brands/brands-list']);
        }
      );
  }

}
