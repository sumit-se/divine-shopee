import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OrdersComponent } from './orders.component';
import { OrderListComponent } from './order-list/order-list.component';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { CartListComponent } from './cart-list/cart-list.component';
import { CartDetailsComponent } from './cart-details/cart-details.component';


const routes: Routes = [
  {
    path: '', component: OrdersComponent, children: [
      {
        path: '',
        redirectTo: 'order-list',
        pathMatch: 'full',
      },
      {
        path: 'order-list',
        component: OrderListComponent,
      },
      {
        path: 'order-details',
        component: OrderDetailsComponent,
      },
      {
        path: 'cart-list',
        component: CartListComponent,
      },
      {
        path: 'cart-details/:id',
        component: CartDetailsComponent,
      },
      {
        path: '**',
        component: NotFoundComponent
      }
    ],
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule {
}
