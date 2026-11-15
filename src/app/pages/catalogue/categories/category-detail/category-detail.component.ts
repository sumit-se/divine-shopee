import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService } from '../services/category.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-category-detail',
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.scss']
})
export class CategoryDetailComponent implements OnInit {
  category: any = {};
  loading: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit() {
    this.loading = true;
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.categoryService.getCategoryById(id)
      .subscribe(
        res => {
          this.category = res;
          this.loading = false;
        },
        _err => {
          this.loading = false;
          this.toastr.error(this.translate.instant('COMMON.ERROR'));
          if (_err.status === 404) {
            this.router.navigate(['pages/catalogue/categories/categories-list']);
          }
        }
      );
  }

}
