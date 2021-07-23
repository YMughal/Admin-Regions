import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ProductsService } from './products.service';
import { categories } from './categories';

const createFormGroup = dataItem =>
  new FormGroup({
    RegionID: new FormControl(dataItem.RegionID),
    RegionName: new FormControl(dataItem.RegionName, Validators.required),
    UnitPrice: new FormControl(dataItem.UnitPrice),
    UnitsInStock: new FormControl(
      dataItem.UnitsInStock,
      Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]{1,2}')
      ])
    ),
    SubRegionID: new FormControl(dataItem.SubRegionID)
  });

@Component({
  selector: 'my-app',
  template: `
    <kendo-grid
      [data]="gridData"
      (dataStateChange)="onStateChange($event)"
      (edit)="editHandler($event)"
      (cancel)="cancelHandler($event)"
      (save)="saveHandler($event)"
      (remove)="removeHandler($event)"
      (add)="addHandler($event)"
      [height]="410"
    >
      <ng-template kendoGridToolbarTemplate>
        <button kendoGridAddCommand>Add new</button>
      </ng-template>
      <kendo-grid-column field="RegionName" title="Region" width="200">
        <ng-template
          kendoGridEditTemplate
          let-dataItem="dataItem"
          let-formGroup="formGroup"
        >
          <kendo-dropdownlist
            #namesDropDown
            [data]="names"
            [formControl]="formGroup.get('RegionName')"
          >
          </kendo-dropdownlist>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column field="SubRegionID" title="SubRegion" width="150">
        <ng-template kendoGridCellTemplate let-dataItem>
          {{ category(dataItem.SubRegionID)?.SubRegionName }}
        </ng-template>
        <ng-template
          kendoGridEditTemplate
          let-dataItem="dataItem"
          let-formGroup="formGroup"
        >
          <kendo-dropdownlist
            [data]="categories"
            (valueChange)="onCategoryChange($event)"
            textField="SubRegionName"
            valueField="SubRegionID"
            [valuePrimitive]="true"
            [formControl]="formGroup.get('SubRegionID')"
          >
          </kendo-dropdownlist>
        </ng-template>
      </kendo-grid-column>
      <kendo-grid-column
        field="UnitPrice"
        title="Price"
        format="{0:c}"
        width="80"
        editor="numeric"
      >
      </kendo-grid-column>
      <kendo-grid-column
        field="UnitsInStock"
        title="In stock"
        width="80"
        editor="numeric"
      >
      </kendo-grid-column>
      <kendo-grid-command-column title="command" width="220">
        <ng-template kendoGridCellTemplate let-isNew="isNew">
          <button kendoGridEditCommand [primary]="true">Edit</button>
          <button kendoGridRemoveCommand>Remove</button>
          <button kendoGridSaveCommand [disabled]="formGroup?.invalid">
            {{ isNew ? 'Add' : 'Update' }}
          </button>
          <button kendoGridCancelCommand>
            {{ isNew ? 'Discard changes' : 'Cancel' }}
          </button>
        </ng-template>
      </kendo-grid-command-column>
    </kendo-grid>
  `
})
export class AppComponent implements OnInit {
  @ViewChild('namesDropDown') private namesDdl;
  private editedRowIndex: number;
  public gridData: any[];
  public categories: any[] = categories;
  public names: any[];
  public formGroup: FormGroup;

  constructor(private service: ProductsService) {}

  public ngOnInit(): void {
    this.gridData = this.service.products();
  }

  public category(id: number): any {
    return this.categories.find(x => x.SubRegionID === id);
  }

  public getNames(subRegionID: number) {
    this.names = subRegionID
      ? this.gridData
          .filter(item => item.SubRegionID === subRegionID)
          .map(item => item.RegionName)
      : this.gridData.map(item => item.RegionName);
  }

  public onCategoryChange(e) {
    this.getNames(e);
    this.formGroup.controls.RegionName.setValue(undefined);
  }

  public addHandler({ sender }) {
    this.closeEditor(sender);

    this.formGroup = createFormGroup({
      RegionName: '',
      UnitPrice: 0,
      UnitsInStock: '',
      SubRegionID: 1
    });

    sender.addRow(this.formGroup);
  }

  public editHandler({ sender, rowIndex, dataItem }) {
    this.closeEditor(sender);

    this.getNames(dataItem.SubRegionID);

    this.formGroup = createFormGroup(dataItem);

    this.editedRowIndex = rowIndex;

    sender.editRow(rowIndex, this.formGroup);
  }

  public cancelHandler({ sender, rowIndex }) {
    this.closeEditor(sender, rowIndex);
  }

  public saveHandler({ sender, rowIndex, formGroup, isNew }): void {
    const product = formGroup.value;

    this.service.save(product, isNew);

    sender.closeRow(rowIndex);
  }

  public removeHandler({ dataItem }): void {
    this.service.remove(dataItem);
  }

  private closeEditor(grid, rowIndex = this.editedRowIndex) {
    grid.closeRow(rowIndex);
    this.editedRowIndex = undefined;
    this.formGroup = undefined;
  }
}
