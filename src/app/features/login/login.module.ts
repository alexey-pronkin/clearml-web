import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {SignupComponent} from './signup/signup.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import {LoginComponent} from '@common/login/login/login.component';
import {SharedPipesModule} from '@common/shared/pipes/shared-pipes.module';
import {NtkmeButtonModule} from '@ctrl/ngx-github-buttons';

@NgModule({
  declarations: [LoginComponent, SignupComponent],
  providers: [],
  imports: [
    CommonModule,
    LoginRoutingModule,
    FormsModule,
    MatAutocompleteModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    SharedPipesModule,
    NtkmeButtonModule,
  ]
})
export class LoginModule { }
