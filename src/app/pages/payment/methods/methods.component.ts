import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { PaymentService } from '../services/payment.service';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { error } from '@angular/compiler/src/util';

@Component({
  selector: 'ngx-payment-methods',
  templateUrl: './methods.component.html',
  styleUrls: ['./methods.component.scss']
})
export class PaymentMethodsComponent implements OnInit {
  loadingList = false;
  paymentData: Array<any> = [];
  // A failed list call used to leave the grid empty and silent, which looks
  // exactly like a store with no payment modules. Hold the reason instead.
  loadError: string = null;
  constructor(
    private paymentService: PaymentService,
    private router: Router,
    private translate: TranslateService,
    private sanitizer:DomSanitizer
  ) {
    this.getPaymentMethodsList()
  }

  ngOnInit() {


  }
  getPaymentMethodsList() {
    this.loadingList = true;
    this.paymentService.getPaymentModules()
      .subscribe(data => {
        this.loadingList = false;
        this.loadError = null;
        this.paymentData = data;
      }, error => {
        this.loadingList = false;
        this.paymentData = [];
        this.loadError = error && error.status === 0
          ? 'Could not reach the server. Is the backend running?'
          : 'Could not load the payment modules (server returned '
            + ((error && error.status) || 'an error')
            + '). Check the backend log.';
      });
  }
  onClickConfigure(value) {
    this.router.navigate(['pages/payment/configure/' + value]);
  }

  transformImage(img){
    let encoded = 'data:image/png;base64,'+ img
    return this.sanitizer.bypassSecurityTrustResourceUrl(encoded);
  }


}
