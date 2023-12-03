import { Component, OnInit, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { liquid } from '../../../assets/js/utils/liquidify.js';
// import { tns } from '../../../assets/js/vendor/ti';
import { avatarHexagons } from '../../../assets/js/global/global.hexagons.js';
import { tooltips } from '../../../assets/js/global/global.tooltips.js';
import { popups } from '../../../assets/js/global/global.popups.js';
import { headers } from '../../../assets/js/header/header.js';
import { sidebars } from '../../../assets/js/sidebar/sidebar.js';
import { content } from '../../../assets/js/content/content.js';
import { form } from '../../../assets/js/form/form.utils.js';
import 'src/assets/js/utils/svg-loader.js';
import '../../../assets/toast/main.js';
declare var toast: any;
//
import { ModalService } from '../service/modal.service';
import { ProfileService } from '../service/profile.service';
import { UIServiveService } from '../service/ui-servive.service';
import { environment } from '../../../environments/environment'
@Component({
    selector: 'app-setting',
    templateUrl: './setting.component.html',
    styleUrls: [
        `../../css/vendor/bootstrap.min.css`,
        `../../css/styles.min.css`,
        // `../../css/dark/dark.min.css`,
        `../../css/vendor/simplebar.css`,
        './setting.component.css',
    ],
})
export class SettingComponent implements OnInit {
    user_id: any = localStorage.getItem('chatUserId');
    public linkProfile: any = environment.baseUrlFe + 'profile?id=' + this.user_id;

    ngOnInit() {
        liquid.liquid();
        avatarHexagons.avatarHexagons();
        tooltips.tooltips();
        popups.popup();
        popups.picturePopup();
        headers.headers();
        sidebars.sidebars();
        content.contentTab();
        form.formInput();
        // this.profileService.openModalChangeMail();
        // this.autoCheck();
        this.mode();
        
    }

    constructor(
        public modalService: ModalService,
        private translateService: TranslateService,
        public profileService: ProfileService,
        private renderer: Renderer2,
        public uiServiveService: UIServiveService
    ) { 
    }
    

    public selectLg(event: any) {
        this.translateService.use(event.target.value);
    }

    copyLink(): void {
        // Get the link text
        const linkToCopy = document.getElementById('linkToCopy') as HTMLLabelElement;

        // Create a temporary text area
        const textArea = document.createElement('textarea');
        textArea.value = linkToCopy.innerText;

        // Append the text area to the DOM
        document.body.appendChild(textArea);

        // Select the text and copy to clipboard
        textArea.select();
        document.execCommand('copy');

        // Remove the temporary text area
        document.body.removeChild(textArea);

        new toast({
            title: 'Thông báo!',
            message: 'Đã sao chép',
            type: 'success',
            duration: 3000,
        });
    }

    /* ========================change mode================================ */
    

    setDarkMode(): void {
        const body = document.body;
        // Nếu dữ liệu đầu vào là null, lấy từ local storage
        const savedDarkMode = localStorage.getItem('dark-mode');
        // let checkbox = document.getElementById("dn") as HTMLInputElement;
        let eActive = document.querySelector('.form-switch');
        if(savedDarkMode==='true'){
            body.classList.remove('dark');
            eActive?.classList.add('active')
            localStorage.setItem('dark-mode','false');
            this.uiServiveService.toggleDarkStyle(false);
        } else{
            body.classList.add('dark');
            eActive?.classList.remove('active');
            localStorage.setItem('dark-mode','true');
            this.uiServiveService.toggleDarkStyle(true);
        }
      }

      mode(): void {
        const body = document.body;
        // Nếu dữ liệu đầu vào là null, lấy từ local storage
        const savedDarkMode = localStorage.getItem('dark-mode');
        // let checkbox = document.getElementById("dn") as HTMLInputElement;
        let eActive = document.querySelector('.form-switch');
        if(savedDarkMode==='true'){
            body.classList.add('dark');
            eActive?.classList.add('active');
            this.uiServiveService.toggleDarkStyle(true);
        } else{
            body.classList.remove('dark');
            eActive?.classList.remove('active');
            this.uiServiveService.toggleDarkStyle(false);
        }
      }
}
