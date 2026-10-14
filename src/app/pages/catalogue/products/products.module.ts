import { NgModule } from '@angular/core';


import { SharedModule } from '../../shared/shared.module';
import { ProductsComponent } from './products.component';
import { ProductsListComponent } from './products-list/products-list.component';
import { ProductCreationComponent } from './product-creation/product-creation.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { AvailableButtonComponent } from './products-list/available-button.component';
import { SpecialToggleComponent } from './products-list/special-toggle.component';
import { OnSiteToggleComponent } from './products-list/on-site-toggle.component';
import { NgxSummernoteModule } from 'ngx-summernote';
import { ManageInventoryComponent } from './inventory/manage-inventory/manage-inventory.component';
import { InventoryFormComponent } from './inventory/inventory-form/inventory-form.component';
import { InventoryCreationComponent } from './inventory/inventory-creation/inventory-creation.component';
import { InventoryDetailsComponent } from './inventory/inventory-details/inventory-details.component';
import { PricesListComponent } from './price/prices-list/prices-list.component';
import { PriceFormComponent } from './price/price-form/price-form.component';
import { ProductToCategoryComponent } from './product-to-category/product-to-category.component';
import { ProductAttributesComponent } from './attribute/product-attributes/product-attributes.component';
import { AttributeFormComponent } from './attribute/attribute-form/attribute-form.component';
import { AttributeRoutingModule } from './routing/attribute-routing.module';
import { ProductsRoutingModule } from './routing/products-routing.module';
import { PriceRoutingModule } from './routing/price-routing.module';
import { InventoryRoutingModule } from './routing/inventory-routing.module';
import { CustomModule } from '../../custom-component/custom.module';
import { ProductsImagesComponent } from './products-images/products-images.component';
import { ProductProperties } from './property/list/product-property.component';
import { ProductPropertyForm } from './property/form/product-property-form.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NbDialogModule } from '@nebular/theme';
import { ProductDiscountComponent } from './product-discount/product-discount.component';
import { ProductStockAlertsComponent } from './stock-alerts/stock-alerts.component';
import { ProductOrderingComponent } from './product-ordering/product-ordering.component';


import { DragDropModule } from '@angular/cdk/drag-drop';
import { ProductVariantsComponent } from './variant/product-variants/product-variants.component';
import { VariantFormComponent } from './variant/variant-form/variant-form.component';

@NgModule({

  declarations: [
    ProductsComponent,
    ProductsListComponent,
    ProductCreationComponent,
    ProductFormComponent,
    ProductDetailsComponent,
    ProductToCategoryComponent,

    AvailableButtonComponent,
    SpecialToggleComponent,
    OnSiteToggleComponent,

    ManageInventoryComponent,
    InventoryDetailsComponent,
    InventoryCreationComponent,
    InventoryFormComponent,

    PricesListComponent,
    PriceFormComponent,

    ProductAttributesComponent,
    AttributeFormComponent,

    ProductVariantsComponent,
    VariantFormComponent,
    ProductsImagesComponent,
    ProductProperties,
    ProductPropertyForm,
    ProductDiscountComponent,
    ProductStockAlertsComponent,
    ProductOrderingComponent,
  ],
  // Ivy is off for this build (tsconfig enableIvy: false), so every component
  // opened through NbDialogService has to be listed here as well as declared.
  entryComponents: [AvailableButtonComponent, SpecialToggleComponent, OnSiteToggleComponent, AttributeFormComponent, ProductPropertyForm, VariantFormComponent],
  imports: [
    ProductsRoutingModule,
    InventoryRoutingModule,
    PriceRoutingModule,
    AttributeRoutingModule,
    SharedModule,
    CustomModule,
    NgxSummernoteModule,
    NbDialogModule.forChild(),
    NgMultiSelectDropDownModule.forRoot(),
    DragDropModule

  ],
})

export class ProductsModule {
}
