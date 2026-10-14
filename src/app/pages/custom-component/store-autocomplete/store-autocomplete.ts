import { Component, forwardRef, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../shared/services/storage.service';
import { StoreService } from '../../store-management/services/store.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'ngx-store-autocomplete',
    templateUrl: './store-autocomplete.html',
    styleUrls: ['./store-autocomplete.scss']
})
export class storeAutoCompleteComponent implements OnInit {


    @Output() onStore: EventEmitter<any> = new EventEmitter();
    public merchant: any = '';
    public _stores = [];
    private label;

    constructor(
        private storeService: StoreService,
        private storageService: StorageService,
        private translate: TranslateService) { }

    ngOnInit() { }

    searchStore() {
        // same 401-then-signout trap as products-list: scope to the user's store
        const storeCode = this.storageService.getMerchant() || 'DEFAULT';
        this.storeService.getListOfStores({ code: storeCode })
            .subscribe(res => {
                let storeData = []
                res.data.forEach((store) => {
                    storeData.push(store.code);
                });
                this._stores = storeData;
            });
    }
    onSelectStore(event) {
        this.onStore.emit(event);
    }

    //   onValueChange(value) {
    //     // console.log(value)
    //     this.onInputChange.emit(value);
    //   }




}
