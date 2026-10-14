import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { TokenService } from '../../auth/services/token.service';
import { catchError, finalize, switchMap, take, filter, map } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { StorageService } from '../services/storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  isRefreshingToken: boolean = false;
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private storageService: StorageService
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token: string = this.tokenService.getToken();

    //console.log('Into http interceptor');

    if (token) {
      request = request.clone({ headers: request.headers.set('Authorization', 'Bearer ' + token) });
    }

    // Every /private/ endpoint resolves its authorization context from the
    // 'store' query param and silently falls back to DEFAULT when it is absent.
    // For a non-superadmin belonging to another merchant that means 401, and
    // globalError.interceptor turns any 401 into a forced sign-out -- so a
    // single forgotten param logs the user out mid-page. Rather than patch each
    // of the ~20 call sites, default it here for authenticated private calls.
    // getMerchantName(), NOT getMerchant(): getMerchant() falls back to an HTTP
    // lookup when localStorage has no 'merchant' yet, and that request re-enters
    // this interceptor, which calls it again -- infinite recursion that blew the
    // stack and left the admin on a blank page for anyone without a stored
    // session (fresh browser, cleared storage, or signed out).
    // getMerchantName() is a plain localStorage read: no network, no cycle.
    const merchant = this.storageService.getMerchantName();
    const alreadyScoped = request.params.has('store') || /[?&]store=/.test(request.urlWithParams);
    if (token && merchant && request.url.indexOf('/private/') !== -1 && !alreadyScoped) {
      request = request.clone({ params: request.params.set('store', merchant) });
    }

    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if (event.status === 0 || event.status === 401) {
            this.authService.logout();
          }
        }
        return event;
      }));

  }


  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return request.clone({ setHeaders: headers });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!this.isRefreshingToken) {
      this.isRefreshingToken = true;

      this.tokenSubject.next(null);

      return <Observable<HttpEvent<any>>>from(this.authService.refresh())
        .pipe(
          switchMap((res: any) => {
            const tokenObj = res.token;
            this.tokenSubject.next(res.token);
            this.tokenService.saveToken(res.token);
            return next.handle(this.addTokenToRequest(request, tokenObj));
          }),
          catchError(err => {
            return from(<any>this.authService.logout());
          }),
          finalize(() => {
            this.isRefreshingToken = false;
          })
        );
    } else {
      this.isRefreshingToken = false;

      return this.tokenSubject
        .pipe(filter(token => token != null),
          take(1),
          switchMap(token => {
            return next.handle(this.addTokenToRequest(request, token));
          }));
    }
  }


}
