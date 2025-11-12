import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssayForm } from './assay-form';

describe('AssayForm', () => {
  let component: AssayForm;
  let fixture: ComponentFixture<AssayForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssayForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssayForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
