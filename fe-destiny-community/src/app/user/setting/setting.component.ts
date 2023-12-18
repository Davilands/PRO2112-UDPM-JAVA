import { Component, OnInit } from '@angular/core';
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

//
import { ModalService } from '../service/modal.service';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: [
    `../../css/vendor/bootstrap.min.css`,
    `../../css/styles.min.css`,
    `../../css/vendor/simplebar.css`,
    './setting.component.css',
  ],
})
export class SettingComponent implements OnInit {
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
  }

  constructor(
    public modalService: ModalService,
    private translateService: TranslateService,
    public profileService: ProfileService
  ) {}
  public selectLg(event: any) {
    this.translateService.use(event.target.value);
  }
}
