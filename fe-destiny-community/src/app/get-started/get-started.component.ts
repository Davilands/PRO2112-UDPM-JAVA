import { Component, OnInit } from '@angular/core';
// Import tệp JS của giao diện
import 'src/assets/js/utils/svg-loader.js';
import { form } from '../../assets/js/form/form.utils.js';
import { tabs } from '../../assets/js/landing/landing.tabs.js';

import { FormsModule } from '@angular/forms';
import {
	FormGroup,
	FormBuilder,
	Validators,
	FormControl,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { delay, catchError, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';

//Xử lí bất đồng bộ
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import '../../assets/toast/main.js';
// import { SocialAuthService } from '@abacritt/angularx-social-login';
import { ActivatedRoute } from '@angular/router';
declare var toast: any;

import { LoginService } from '../service/login.service';
@Component({
  selector: 'app-get-started',
  templateUrl: './get-started.component.html',
  styleUrls: [
    `../css/vendor/bootstrap.min.css`,
    `../css/styles.min.css`,
    './get-started.component.css'
  ]
})
export class GetStartedComponent implements OnInit{
  public loginForm!: FormGroup;
  submitted: boolean = false;
  checkedRemember: boolean = false;
  private loginAdmin = '';

  constructor(
		private formbuilder: FormBuilder,
    public loginService: LoginService,
    private cookieService: CookieService,
    private http: HttpClient,
		private router: Router,
	) {
    this.createFormLogin();
	}

  ngOnInit() {

    // Giao diện
    tabs.tabs();
    form.formInput();
  }

  createFormLogin() {
		this.loginForm = this.formbuilder.group({
			email: [''],
			password: [''],
		});
	}

	get loginFormControl() {
		return this.loginForm.controls;
	}

  loginWithEmailAndPassword() {
		this.submitted = true;
		// if (this.loginForm.valid) {
		this.loginService.loginUser(this.loginForm.value).subscribe((response) => {

			function delay(ms: number) {
				return new Promise(function (resolve) {
					setTimeout(resolve, ms);
				});
			}
			if (response == '') {
				new toast({
					title: 'Thất bại!',
					message: 'Email hoặc mật khẩu không đúng!',
					type: 'error',
					duration: 5000,
				});
			} else {
				if (
					this.checkedRemember == true &&
					response.roles[0].authority == 'ROLE_USER'
				) {
					this.setCookie('sessionID', response.user.sesionId, 2);
				}
				if (response.roles[0].authority == 'ROLE_ADMIN') {
					// let userAdmin = {
					// 	email: this.loginForm.get('email')!.value,
					// 	password: this.loginForm.get('password')!.value,
					// };
					// this.logAdmin(userAdmin);
					// window.location.href =
					// 	'http://localhost:8080/oauth/rec/' +
					// 	userAdmin.email +
					// 	'/' +
					// 	userAdmin.password;
          			window.location.href = 'http://localhost:4200/admin/index';
					this.loginForm.reset();
				} else {
					this.cookieService.set('full_name', response.name);
					this.cookieService.set('userEmail', this.loginForm.get('email')!.value);
					this.cookieService.set('isUserLoggedIn', JSON.stringify(response.sesionId)
					);
					delay(500).then((res) => {
						this.loginForm.reset();
						this.router.navigate(['newsfeed']);
						new toast({
							title: 'Thành công!',
							message: 'Đăng nhập thành công',
							type: 'success',
							duration: 1500,
						});
						// delay(1500).then((_) => {
						// 	location.reload();
						// });
					});
				}
			}
		});
		// } else {
		//   return;
		// }
	}

  setCookie(cname, cvalue, exdays) {
		const d = new Date();
		d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
		let expires = 'expires=' + d.toUTCString();
		document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
	}
  logAdmin(data: any) {
		// return this.http.post(this.userURL, data);
		this.http.post<any>(this.loginAdmin, data).pipe(
			// tap(() => console.log("Lấy dữ liệu thành công")),
			tap((receivedUser) =>
				console.log(`receivedUser = ${JSON.stringify(receivedUser)}`)
			),
			catchError((error) => of([]))
		);
	}
	bulk(e) {
		if (e.target.checked == true) {
			this.checkedRemember = true;
		} else {
			this.checkedRemember = false;
		}
	}
	isLogin() {
		return this.loginService.isLogin();
	}
	showHidePassLogin() {
		let input = document.getElementById('passwordForm') as HTMLInputElement;
		// console.log(input!);
		if (input.type === 'password') {
			input.type = 'text';
			document.getElementById('eye')!.className = 'fa-regular fa-eye';
		} else {
			input.type = 'password';
			document.getElementById('eye')!.className = 'fa-regular fa-eye-slash';
		}
	}
	showHidePassRegister() {
		let input2 = document.getElementById('register-password') as HTMLInputElement;
		let input3 = document.getElementById('register-rePassword') as HTMLInputElement;
		if (input2.type === 'password' || input2.type === 'password') {
			input2.type = 'text';
			input3.type = 'text';
			document.getElementById('eye2')!.className = 'fa-regular fa-eye';
			document.getElementById('eye3')!.className = 'fa-regular fa-eye';
		} else {
			input2.type = 'password';
			input3.type = 'password';
			document.getElementById('eye2')!.className = 'fa-regular fa-eye-slash';
			document.getElementById('eye3')!.className = 'fa-regular fa-eye-slash';
		}
	}
}