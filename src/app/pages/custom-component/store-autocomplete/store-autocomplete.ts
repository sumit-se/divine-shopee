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
        // No code filter — return all stores so a superadmin can select any of them.
        // 'store' (the auth context) is added by getListOfStores automatically.
        this.storeService.getListOfStores({})
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
