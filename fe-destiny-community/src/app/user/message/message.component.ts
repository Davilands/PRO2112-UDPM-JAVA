import { Component, OnInit, ElementRef, Input, Renderer2, HostListener,ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { liquid } from "../../../assets/js/utils/liquidify.js";
import { avatarHexagons } from '../../../assets/js/global/global.hexagons.js';
import { tooltips } from '../../../assets/js/global/global.tooltips.js';
import { popups } from '../../../assets/js/global/global.popups.js';
import { headers } from '../../../assets/js/header/header.js';
import { sidebars } from '../../../assets/js/sidebar/sidebar.js';
import { content } from '../../../assets/js/content/content.js';
import { form } from '../../../assets/js/form/form.utils.js';
import 'src/assets/js/utils/svg-loader.js';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from '@angular/fire/storage';
// 
import { ModalService } from '../service/modal.service';
import { MessageService } from '../service/message.service';
import { environment } from '../../../environments/environment'
import { UserModel } from '../Model/UserModel.js';
// import { CustomTimePipe } from '@app/custom-time.pipe';
@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: [
    `../../css/vendor/bootstrap.min.css`,
    `../../css/styles.min.css`,
    `../../css/vendor/simplebar.css`,
    './message.component.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent implements OnInit {
  message: string = ''; // Biến để lưu trữ nội dung nhập
  checkIsOnline: boolean = true
  sender: any;
  checkListChat: boolean = false;
  listFriendss: any;
  listMessages: any;
  mapUser = new Map<string, UserModel>();
  isOnline: string | undefined;
  image: string | undefined;
  fullname: string | undefined;
  id: string = '';
  $chatHistory: any;
  $mess: any;
  $button: any;
  $textarea: any;
  $chatHistoryList: any;
  userFromLoginCustom: number = 0;
  userToLoginCustom: number = 0;
  usersTemplateHTML: string;
  count: number = 0;
  isLoading = true;
  data: any;
  mapTemp: any;
  searchResult: any[] = [];
  searchTerm: string = '';
  noResults: boolean = false; // Biến để kiểm tra xem có kết quả hay không
  checkLoadingdata: boolean = true;
  checkBlock: boolean = false;
  checkClick: boolean = true;

  ngOnInit() {
    
    this.messageService.isOriginal = true;
    this.isLoading = this.messageService.isLoading;

    if (this.messageService.mapUser != null || this.mapTemp != null) {
      this.mapUser = this.messageService.mapUser;
      this.data = Array.from(this.messageService.mapUser.values());
      this.mapTemp = this.messageService.mapUser;
    }
    this.messageService.dataUpdated.subscribe(() => {
      // Đây là nơi bạn đặt mã để xử lý khi dữ liệu đã được cập nhật.
      // Chuyển dữ liệu từ Map thành một mảng.

      this.data = Array.from(this.messageService.mapUser.values());
      this.mapTemp = this.messageService.mapUser;
    this.cdr.markForCheck();

    });
    if (this.messageService.checkSelected != '') {
      this.selectedUser(this.messageService.checkSelected);
    }
    
    liquid.liquid();
    avatarHexagons.avatarHexagons();
    tooltips.tooltips();
    popups.popup();
    popups.picturePopup();
    headers.headers();
    sidebars.sidebars();
    content.contentTab();
    form.formInput();
    // this.checkScrollPosition();
    
  }

  constructor(
    public modalService: ModalService,
    public messageService: MessageService,
    private el: ElementRef,
    private renderer: Renderer2,
    public storage: Storage,
    private cdr: ChangeDetectorRef,
    // public customTimePipe: CustomTimePipe
  ) {
  }

  /* ============Message============= */

  search() {
    if (this.searchTerm.trim() === '') {
      // Nếu không có giá trị tìm kiếm, hiển thị toàn bộ danh sách
      this.searchResult = this.data;
      this.noResults = false;
    } else {
      // Nếu có giá trị tìm kiếm, thực hiện tìm kiếm
      this.searchResult = this.data.filter(item => item.fullname.includes(this.searchTerm));
      this.noResults = this.searchResult.length === 0;
    }
  }

  block() {
    let id = parseInt(this.id)
    this.messageService.blockApi(id, false).subscribe(() => {

      this.selectedUser(this.id);
    })
  }

  unBlock() {
    let id = parseInt(this.id)
    this.messageService.blockApi(id, true).subscribe(() => {

      this.selectedUser(this.id);
    })
  }

  selectedUser(userid) {
    this.checkBlock = false;
    this.messageService.checkUserBlock = false;
    let chatContainer = document.getElementById("chatContainer") as HTMLElement;
    if (chatContainer) {
      chatContainer.style.opacity = '0';
      this.checkLoadingdata = true;
    }
    if (this.id != '') {
      this.renderer.removeClass(this.el.nativeElement.querySelector('#chat-widget-message-' + this.id), 'active');
    }
    
    this.messageService.mapNotification.set(userid, false);
    let mapEntries = Array.from(this.messageService.mapNotification.entries());
    let hasTrueValue = mapEntries.some(([key, value]) => value === true);
    if (!hasTrueValue) {
      this.messageService.notif_mess = false;
    }
    this.messageService.selectedUser = userid;
    this.id = userid;
    this.messageService.isOriginal = false;
    if (this.mapTemp) {
      this.image = this.mapTemp.get(userid)?.avatar;

      this.fullname = this.mapTemp.get(userid)?.fullname;

      if (this.mapTemp.get(userid)?.type == 'LEAVE') {
        this.isOnline = 'Offline';
        this.checkIsOnline = false;
      } else {
        this.isOnline = 'Online';
        this.checkIsOnline = true;
      }
    }

    //Xử lý sự kiện khi click vào chat
    let element = this.el.nativeElement.querySelector('#chat-widget-message-' + userid); // Lấy phần tử dựa trên ID
    if (element) {
      this.renderer.addClass(element, 'active'); // Thêm class "active" vào phần tử khi click
    }

    let datetemp = "";
    let countMessage = document.getElementById('count-mess-' + this.id);
    if (countMessage) {
      countMessage.parentNode?.removeChild(countMessage);
    }
    this.messageService.loadMessage(this.id).subscribe((res) => {
      if (this.count > 0 && this.checkClick==false) {
        document.querySelectorAll(".chat-widget-speaker, .time-date, .br, .notify-block,.review-img").forEach((e) => {
          e.remove();
        });
        this.count = 0;
        this.checkClick=false;
      }
      this.count++;
      this.$chatHistory = $('.chat-widget-conversation');
      this.messageService.listMessages = JSON.parse(JSON.stringify(res))[0];
      this.messageService.checkScroll = 1;
      this.checkLoadingdata = false;
      this.checkClick=true;
      this.cdr.markForCheck();
      if (chatContainer && !this.checkLoadingdata) {
        chatContainer.style.opacity = '1';
      }
      this.scrollToBottom();
    });
    this.$textarea = $('#chat-widget-message-text-2');
    this.$textarea.val('');

  }

  trackByFn(index: number, item: any): any {
    return item[0]; // Sử dụng một giá trị duy nhất từ mỗi mục
  }

  addMessage() {
    this.$textarea = $('#chat-widget-message-text-2');
    if (this.$textarea.val().trim() !== '') {
      this.sendMessage(this.$textarea.val());
    }
  }
  addMessageEnter(event) {
    if (event.keyCode === 13) {
      this.addMessage();
    }
  }
  async sendMessage(message) {
    let username = localStorage.getItem("chatUserId");
    this.sender = JSON.parse(JSON.stringify(this.messageService.getSender()));
    let avatar = this.sender.avatar;
    let i = 0;
    this.$chatHistory = $('.chat-widget-conversation');
    this.$textarea = $('#chat-widget-message-text-2');
console.warn("this.file.length: " + this.file.length);
    if (this.file.length > 0) {
      for (let img of this.file) {
        await this.addData(img);
        i++;
      }
    }

    if (message.trim() !== '' || i > 0) {
      let type = '';
      let images: string[] = [];
      if (this.file.length > 0) {
        type = 'image';
        for (let img of this.file) {
          await this.addData(img);
        }
        images=this.listImg;
      }
      if (this.messageService.checkUserBlock === false) {
        this.messageService.sendMsg(username, message, avatar, type, images);
        this.scrollToBottom();
      } else {
        this.$chatHistory.append(
          '<div class="notify-block" style="text-align: center;font-size: 14px;font-family: Helvetica, Arial, sans-serif;color: red;font-weight: 700;">Bạn đã bị chặn!</div>'
        );
      }
      message = '';
      this.scrollToBottom();
      this.$textarea.val('');
    }
  }

  // getCurrentTime() {
  //   let date = new Date();
  //   let hours = (date.getHours() < 10) ? '0' + (date.getHours()) : (date.getHours());
  //   let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : (date.getMinutes());
  //   let newTime = hours + ':' + minutes;
  //   return newTime;
  // }
  // getCustomTime(time) {
  //   console.warn("length: "+this.messageService.listMessages.length);
    
  //   if (this.checkScroll === this.messageService.listMessages.length) {
  //     this.scrollToBottom();
  //   }
  //   console.warn("this.checkScroll: "+this.checkScroll);
  //   this.checkScroll++;
  //   let date = new Date(time);
  //   let hours = (date.getHours() < 10) ? '0' + (date.getHours()) : (date.getHours());
  //   let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : (date.getMinutes());
  //   let newTime = hours + ':' + minutes;
  //   return newTime;
  // }

  // customTime(time) {
  //   let regex = /(\d{2}:\d{2})/;
  //   let match = time.match(regex);
  //   if (match) {
  //     let extractedTime = match[1]; // Extracted "15:43"
  //     return extractedTime;
  //   } else {
  //     return null;
  //   }
  // }

  // checkDate(date: string) {
  //   let date1 = new Date(date.substring(0, 10));
  //   let d = new Date();
  //   let day = d.getDate(); // Lấy ngày trong tháng (1-31)
  //   let month = d.getMonth() + 1; // Lấy tháng (0-11), nên cộng thêm 1
  //   let year = d.getFullYear();
  //   let date2 = new Date(year + '-' + month + '-' + day);
  //   // console.log("date1: "+date1);
  //   // console.log("date2: "+date2);
  //   // console.log('date1 < date2: '+(date1 < date2));
  //   if (date1 < date2 && (date2.getDate() - 1) == date1.getDate()) {
  //     return "Hôm qua";
  //   } else if (date1 < date2 && (date2.getDate() - 1) > parseInt(date.substring(8, 10))) {
  //     let year = (date1.getFullYear() < date2.getFullYear()) ? '-' + date1.getFullYear() : '';
  //     let month = (date1.getMonth() + 1 < 10) ? '0' + (date1.getMonth() + 1) : (date1.getMonth() + 1);
  //     let day = (date1.getDate() < 10) ? '0' + date1.getDate() : date1.getDate();
  //     return day + '-' + month + year;
  //   } else {
  //     return "Hôm nay";
  //   }
  // }

  /* ===================Thu hồi tin nhắn================================= */
  async messageRecall(id: number, position) {
    let from = parseInt(localStorage.getItem("chatUserId") + '');
    let to = parseInt(this.messageService.selectedUser + '');
    const newListMessage = await this.messageService.messageRecallApi(id, position, from, to);
    this.messageService.listMessages.splice(position, 1, ...newListMessage);
    let textLastMess = document.getElementById('last-message-' + this.selectedUser);
    if (textLastMess) textLastMess!.innerText = 'Bạn đã thu hồi tin nhắn';
    this.hideAllDropdowns();
  }

  /* ============send image============= */
  listImg: any[] = [];
  imageSources: string[] = [];
  public file: any = {};

  uploadImg(event: any) {
    this.file = event.target.files;
    const blobs = this.toBlob(this.file);
    this.imageSources = blobs.map(blob => URL.createObjectURL(blob));
    console.warn("this.imageSources: " + this.imageSources);
  }

  // 
  toBlob(files: FileList) {
    const blobs: Blob[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)!;
      const blob = new Blob([file], { type: file.type });
      blobs.push(blob);
    }
    return blobs;
  }
  createFileList(array) {
    const dataTransfer = new DataTransfer();
    for (const file of array) {
      dataTransfer.items.add(file);
    }
    return dataTransfer.files;
  }

  async addData(file: any) {
    return new Promise<void>((resolve) => {
      const storageRef = ref(this.storage, 'message-image/' + file.name);
      //sử dụng Firebase Storage để tải lên tệp (file) vào lưu trữ Firebase
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => { },
        (error) => {
          console.log(error.message);
          resolve();
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            this.listImg.push(downloadURL);
            resolve();
          });
        }
      );
    });
  }
  deleteImg(event: any, i) {
    if (i >= 0 && i < this.file.length) {
      // Tạo một mảng thường
      const newArray = Array.from(this.file);
      // Xóa phần tử từ mảng thường
      newArray.splice(i, 1);
      // Cập nhật this.file từ mảng thường
      this.file = this.createFileList(newArray);
      // Sau khi xóa, tạo lại danh sách blobs và image sources
      const blobs = this.toBlob(this.file);
      this.imageSources = blobs.map(blob => URL.createObjectURL(blob));
    }
  }


  /* ============template============= */
  scrollToBottom() {
    this.$chatHistory = $('.chat-widget-conversation')!;
    this.$chatHistory.scrollTop(this.$chatHistory[0]!.scrollHeight);
    // alert(this.$chatHistory[0]!.scrollHeight);
  }

  checkScrollPosition() {
    const scrollableDiv = document.getElementById('chatContainer')!;
    const scrollButton = document.getElementById('scrollToBottomButton')!;
    // Thêm sự kiện lắng nghe lướt cho thẻ div
    scrollableDiv.addEventListener('scroll', () => {
      this.hideAllDropdowns();
      // Kiểm tra vị trí cuộn
      if ((scrollableDiv.scrollHeight - scrollableDiv.clientHeight - Math.round(scrollableDiv.scrollTop)) > 1) {
        // Hiển thị nút scroll khi cuộn đến vị trí cuối cùng (điều kiện kiểm tra lúc này có thể khác)
        scrollButton.style.display = 'block';
      } else {
        // Ẩn nút scroll nếu không cuộn xuống
        scrollButton.style.display = 'none';
      }
    });
  }


  checkEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.addMessage();
    }
  }

  onRightClick(event: MouseEvent, messageId: string) {
    event.preventDefault();
    const targetElement = event.target as HTMLElement;
    const messageDiv = targetElement.closest('.chat-widget-speaker-message') as HTMLElement;

    const dropdown = document.getElementById(`recall-menu-${messageId}`) as HTMLElement;

    if (dropdown) {
      const isDropdownVisible = dropdown.style.display === 'block';

      this.hideAllDropdowns();

      dropdown.style.display = isDropdownVisible ? 'none' : 'block';

      // Ẩn menu nếu click bên ngoài menu
      document.addEventListener('click', function (event) {
        if (!dropdown.contains(targetElement) && event.target !== messageDiv) {
          dropdown.style.display = 'none';
        }
      });
    }
  }
  hideAllDropdowns() {
    // Ẩn tất cả các dropdown trên trang
    const allDropdowns = document.querySelectorAll('.recall-menu') as NodeListOf<HTMLElement>;
    allDropdowns.forEach(dropdown => (dropdown.style.display = 'none'));
  }


}
