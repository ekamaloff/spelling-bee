import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {FormsModule} from "@angular/forms";
import { CookieService } from "ngx-cookie-service";
import {ToastsContainer} from "./toasts-container.component";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {WindowRef} from "./window-ref.service";

@NgModule({
  declarations: [
    AppComponent,
    ToastsContainer
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    HttpClientModule
  ],
  providers: [
    CookieService,
    WindowRef
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
