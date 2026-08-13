import { Routes } from '@angular/router';

import {HomeComponent} from './pages/home/home';
import {LoginComponent} from './pages/login/login';
import {RegisterComponent} from './pages/register/register';
import {PassengerDashboardComponent} from './pages/passenger/dashboard/dashboard';
import {DriverDashboardComponent} from './pages/driver/dashboard/dashboard';

export const routes: Routes = [
    {path:'', component: HomeComponent},
    {path:'login', component:LoginComponent},
    {path:'register', component:RegisterComponent},
    {path:'passenger/dashboard', component: PassengerDashboardComponent},
    {path:'driver/dashboard', component: DriverDashboardComponent},
    {path:'**',redirectTo:''}
];
