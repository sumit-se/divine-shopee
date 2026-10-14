import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { EmailConfigurationService } from '../services/email-configuration.service';

/**
 * Outgoing mail settings for the store.
 *
 * Order confirmations, status-change notices, password resets and the contact
 * form all go out through whatever is set here, so an empty or wrong
 * configuration shows up as "the shop sends no email" rather than as an error
 * anyone sees.
 *
 * The password is write-only: the API never returns it, so the field always
 * renders empty even when one is stored. Leaving it empty on save keeps the
 * stored password, which is what makes it possible to correct a port or a
 * username without having to re-enter the credential.
 */
@Component({
  selector: 'ngx-store-email',
  templateUrl: './store-email.component.html',
  styleUrls: ['./store-email.component.scss']
})
export class StoreEmailComponent implements OnInit {

  form: FormGroup;
  loading = false;
  loadingButton = false;
  /** true once something is stored, which is also what makes the password optional */
  configured = false;
  showPassword = false;

  constructor(
    private emailConfigurationService: EmailConfigurationService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.loading = true;
    this.emailConfigurationService.getEmailConfiguration()
      .subscribe(res => {
        // a host is the one field nothing works without, so it stands in for
        // "there is a configuration here"
        this.configured = !!(res && res.host);
        if (this.configured) {
          this.form.patchValue({
            host: res.host,
            port: res.port,
            protocol: res.protocol || 'smtp',
            username: res.username,
            smtpAuth: !!res.smtpAuth,
            starttls: !!res.starttls
          });
        }
        this.applyPasswordRule();
        this.loading = false;
      }, error => {
        this.loading = false;
      });
  }

  private createForm() {
    this.form = this.formBuilder.group({
      host: ['', [Validators.required]],
      port: ['', [Validators.required]],
      protocol: ['smtp', [Validators.required]],
      username: ['', [Validators.required]],
      password: [''],
      smtpAuth: [true],
      starttls: [true]
    });
  }

  /**
   * Required on a first save, optional afterwards -- otherwise the form could
   * never be submitted without retyping a credential the screen cannot show.
   */
  private applyPasswordRule() {
    const password = this.form.get('password');
    password.setValidators(this.configured ? [] : [Validators.required]);
    password.updateValueAndValidity();
  }

  /**
   * Gmail and Office 365 want STARTTLS on 587 and implicit TLS on 465, and
   * getting that pair wrong is the single most common reason mail silently
   * stops. Follow the port rather than make someone look it up.
   */
  onPortChange() {
    const port = (this.form.get('port').value || '').toString().trim();
    if (port === '465') {
      this.form.patchValue({ protocol: 'smtps', starttls: false });
    } else if (port === '587' || port === '25') {
      this.form.patchValue({ protocol: 'smtp', starttls: true });
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loadingButton = true;
    const config = { ...this.form.value };
    // an empty string would be saved as an empty password; omit it instead, so
    // the API keeps what is stored
    if (!config.password) {
      delete config.password;
    }
    this.emailConfigurationService.saveEmailConfiguration(config)
      .subscribe(res => {
        this.toastr.success(this.translate.instant('EMAIL_CONFIGURATION.SAVED'));
        this.configured = true;
        // never leave the credential sitting in the DOM after it is saved
        this.form.patchValue({ password: '' });
        this.showPassword = false;
        this.applyPasswordRule();
        this.loadingButton = false;
      }, error => {
        this.toastr.error(this.translate.instant('EMAIL_CONFIGURATION.NOT_SAVED'));
        this.loadingButton = false;
      });
  }

}
