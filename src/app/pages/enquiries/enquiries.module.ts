import { NgModule } from '@angular/core';

import { EnquiriesRoutingModule, routedComponents } from './enquiries-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [...routedComponents],
  imports: [
    EnquiriesRoutingModule,
    SharedModule
  ]
})
export class EnquiriesModule { }
