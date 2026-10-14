import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EnquiriesComponent } from './enquiries.component';

const routes: Routes = [{
  path: '',
  component: EnquiriesComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnquiriesRoutingModule { }

export const routedComponents = [EnquiriesComponent];
