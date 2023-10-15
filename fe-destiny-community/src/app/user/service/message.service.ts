import { Injectable, EventEmitter } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import '../../../assets/toast/main.js';
declare var toast: any;
import SockJS from "sockjs-client"
import Stomp from "stompjs"
import * as Handlebars from 'handlebars';
import { UserModel } from './UserModel.js';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private loadDataChat = environment.baseUrl + 'v1/user/registrationchat';
  private loadDataMess = environment.baseUrl + 'v1/user/chat/load/messages';

  private sender: any[] = []
  private listFriends: any[] = []
  private listMess: any[] = []

  isLoading = true;

  socket?: WebSocket;
  stompClient?: Stomp.Client;
  selectedUser = null;
  $chatHistory: any;
  $tab_message: any;
  $element: any;
  $pCount: any;
  messageTo: string;
  usersTemplateHTML = "";
  dataUpdated = new EventEmitter<void>();
  mapUser = new Map<string, UserModel>();
  newMapUser = new Map<string, UserModel>();
  mapTime = new Map<string, string>();
  newMessage = new Map<string, { message: string, avatar: string }>();
  checkConnected: boolean = false;
  isOriginal: boolean = true;
  public notif_mess: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  /* ============API============= */
  loadDataSender() {
    return this.http.get<any>(this.loadDataChat).pipe(
      tap((response) => {
        this.sender = JSON.parse(JSON.stringify(response));
        this.setSender(this.sender);
      }),
    );
  }

  loadMessage(data: string) {
    return this.http.post<string>(this.loadDataMess, data).pipe(
      tap((res) => {
        this.listMess = JSON.parse(JSON.stringify(res));
        this.setListMess(this.listMess);
      }),
      catchError((err) => of([]))
    )
  }

  /* ============Connect socket============= */
  connectToChat(userId) {
    localStorage.setItem("chatUserId", userId);
    this.socket = new SockJS(environment.baseUrl + 'chat');
    this.stompClient = Stomp.over(this.socket!);
    this.stompClient.connect({}, (frame) => {
      // console.log('connected to: ' + frame);
      this.stompClient!.subscribe("/topic/messages/" + userId, (response) => {
        let data = JSON.parse(response.body);
        let time = document.getElementById('floaty-' + data.fromLogin);
        if (time) {
          time!.innerText = 'Vài giây';
        }
        if (this.mapTime.has(data.fromLogin)) {
          // this.mapTime.delete(data.fromLogin);
          this.mapTime.set(data.fromLogin, new Date().toISOString() + '');
        }
        let textLastMess = document.getElementById('last-message-' + data.fromLogin);
        if (textLastMess)
          textLastMess!.innerText = data.message;
        if (this.selectedUser == data.fromLogin && this.isOriginal == false) {
          this.render(data.message, data.fromLogin, data.avatar);
        } else {
          let audio = new Audio();
          audio.src="../../../assets/js/sound/notify.mp3";
          audio.play();
          this.notif_mess = true;
          this.newMessage.set(data.fromLogin, { message: data.message, avatar: data.avatar });

          let countMessage = document.getElementById('count-mess-' + data.fromLogin);
          // let pCount = document.getElementById('p-count-mess-' + data.fromLogin);
          this.$pCount = $('#p-count-mess-' + data.fromLogin);

          if (countMessage) {
            let count: string | undefined;
            count = '' + countMessage.textContent?.trim();
            let num = parseInt(count) + 1;
            countMessage.parentNode?.removeChild(countMessage);
            this.$pCount.append('<p class="user-status-timestamp count-mess" id="count-mess-' + data.fromLogin + '"' +
              'style="position: absolute;top: 32%;right: 5%;padding: 3px 8px;background: red;border-radius: 50%;margin-top: 10px;color: #8f91ac;font-size: 0.75rem;font-weight: 500;line-height: 1em;">' +
              ' <span"' +
              ' style="color: white;font-family: Helvetica,Arial,sans-serif;font-size: 9px;" >' + num + '</span>' +
              '</p>');
          } else {
            this.$pCount.append('<p class="user-status-timestamp count-mess"  id="count-mess-' + data.fromLogin + '"' +
              'style="position: absolute;top: 32%;right: 5%;padding: 3px 8px;background: red;border-radius: 50%;margin-top: 10px;color: #8f91ac;font-size: 0.75rem;font-weight: 500;line-height: 1em;">' +
              ' <span' +
              ' style="color: white;font-family: Helvetica,Arial,sans-serif;font-size: 9px;" >' + 1 + '</span>' +
              '</p>');
          }

        }

      });
      this.stompClient!.subscribe("/topic/public", (response) => {

        let data = JSON.parse(response.body);
        this.setFriend(data);
        // let usersTemplateHTML = "";
        let userId = localStorage.getItem("chatUserId");

        for (let key of Object.keys(data)) {
          let value = data[key];

          if (key == localStorage.getItem("chatUserId")) {
            for (let v of value) {
              let user: UserModel = {
                type: v.type,
                user_id: v.user_id,
                username: v.username,
                fullname: v.fullname,
                email: v.email,
                avatar: v.avatar,
                messageUnRead: v.messageUnRead,
                lastMessage: v.lastMessage,
                online: this.customTime(v.online),
                isFriend: v.friend,
                hide: v.hide,
                status: v.status,
              };
              // Thêm người dùng vào danh sách của key trong map
              this.newMapUser.set(v.user_id, user);
              this.mapTime.set(v.user_id, v.online);
            }

          }
        }
        // this.isLoading = false;
        setTimeout(() => {
          this.mapUser = this.newMapUser;
          this.updateData();
          //  let mapTemp = new Map<string,string>();
          //  mapTemp=this.mapTime;
          setInterval(() => {
            if (this.mapTime != null) {
              for (let [key, value] of this.mapTime) {
                let time = document.getElementById('floaty-' + key);
                if (time) {
                  time.innerText = this.customTime(value);
                }
              }
            }
          }, 60000);
        }, 1);
      });
      this.stompClient!.send("/app/fetchAllUsers");
    });
    
    this.isLoading = false;
  }

  logout(){
    this.stompClient!.send("/app/fetchAllUsers");
  }

  // async connectToChat(userId) : Promise<void>{
  //   // Lưu trữ userId vào localStorage
  //   localStorage.setItem("chatUserId", userId);

  //   // Tạo một Promise để đợi kết nối WebSocket
  //   return new Promise((resolve) => {
  //     const socket = new SockJS(environment.baseUrl + 'chat');
  //     const stompClient = Stomp.over(socket);


  //     stompClient.connect({}, (frame) => {
  //       // Đã kết nối thành công
  //       console.log('Connected to: ' + frame);

  //       // Bắt đầu đăng ký các chủ đề và xử lý thông điệp
  //       stompClient.subscribe("/topic/messages/" + userId, (response) => {
  //         let data = JSON.parse(response.body);
  //         if (this.selectedUser == data.fromLogin && this.isOriginal == false) {
  //           this.render(data.message, data.fromLogin, data.avatar);
  //         } else {
  //           this.notif_mess = true;
  //           this.newMessage.set(data.fromLogin, { message: data.message, avatar: data.avatar });
  //           let textLastMess = document.getElementById('last-message-' + data.fromLogin);
  //           if (textLastMess)
  //             textLastMess!.innerText = data.message;
  //         }
  //       });

  //       stompClient.subscribe("/topic/public", (response) => {
  //         let data = JSON.parse(response.body);
  //         this.setFriend(data);
  //         let localUserId = localStorage.getItem("chatUserId");
  //         for (let key of Object.keys(data)) {
  //           let value = data[key];
  //           if (key == localUserId) {
  //             for (let v of value) {
  //               let user = {
  //                 type: v.type,
  //                 user_id: v.user_id,
  //                 username: v.username,
  //                 fullname: v.fullname,
  //                 email: v.email,
  //                 avatar: v.avatar,
  //                 messageUnRead: v.messageUnRead,
  //                 lastMessage: v.lastMessage,
  //                 online: v.online,
  //                 isFriend: v.friend,
  //                 hide: v.hide,
  //                 status: v.status,
  //               };
  //               this.newMapUser.set(v.user_id, user);
  //             }
  //           }
  //         }
  //         this.isLoading = false;
  //         setTimeout(() => {
  //           this.mapUser = this.newMapUser;
  //           this.updateData();
  //           // Hoàn thành Promise sau khi xử lý xong
  //         }, 1);
  //       });
  //       stompClient.send("/app/fetchAllUsers");
  //     });
  //     resolve();
  //   });
  // }

  // Hàm cập nhật dữ liệu
  updateData() {
    // Thực hiện cập nhật dữ liệu ở đây.
    // Sau khi cập nhật xong, thông báo sự kiện.
    this.dataUpdated.emit();
  }
  // async sendMsg(from, text, img) : Promise<void> {
  //   try {
  //     await new Promise<void>((resolve) => {
  //       this.stompClient!.send("/app/chat/" + this.selectedUser, {}, JSON.stringify({
  //         fromLogin: from,
  //         message: text,
  //         avatar: img
  //       }));
  //       resolve();
  //     });
  //   } catch (error) {
  //     console.error('Lỗi khi gửi tin nhắn:', error);
  //   }
  // }



  sendMsg(from, text, img) {
    this.stompClient!.send("/app/chat/" + this.selectedUser, {}, JSON.stringify({
      fromLogin: from,
      message: text,
      avatar: img
    }));
    let textLastMess = document.getElementById('last-message-' + this.selectedUser);
    if (textLastMess)
      textLastMess!.innerText = text;
    let time = document.getElementById('floaty-' + this.selectedUser);
    if (time) {
      time!.innerText = 'Vài giây';
    }
    this.mapTime.set(this.selectedUser + '', new Date().toISOString() + '');
    // }
  }

  render(message, userName, img) {
    setTimeout(() => {
      this.$chatHistory = $('.chat-widget-conversation');
      this.scrollToBottom();
      this.$chatHistory.append(
        '<div class="chat-widget-speaker left" style="padding: 0 26px 0 36px; display: flex; flex-flow: column; position: relative; margin-bottom: 1rem !important;">' +
        '<a class="user-avatar small user-status-avatar no-border no-outline avatar-mess" href="profile" style="position: absolute;left: -10px;top: -8px; width: 40px;height: 44px; display: block;"> ' +
        '<div class="hexagon-container" style="width: 35px; height: 38px; position: relative; margin: 0 auto;background: white;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); "> ' +
        '<div class="hexagon user-avatar-content" style="top: 6px;left: 5px;position: absolute;z-index: 3;width: 40px;height: 44px;overflow: hidden;">  ' +
        '<div class="hexagon-image" ' +
        'style="background-image: url(' + img + '); width: 20px; height: 23px;position: relative; z-index: 3;background-size: cover;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);left: 4%;top: 2%;"></div>' +
        '</div>' +
        '<div class="hexagon user-avatar-border" style="position: absolute;top: 0;left: 0;z-index: 1;">' +
        '<div style="position: absolute; top: 0; left: 0; z-index: 1; content: \'\'; width: 32px; height: 36px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); left: 1px; top: 0px; background-image: linear-gradient(to right, #41efff, #615dfa); display: block;"></div>' +
        '<div class="hexagon-border"></div>' +
        '</div>' +
        '<div class="hexagon user-avatar-progress-border" style="margin-left: 11%;margin-top: 10.3%; width: 26px;height: 29px;top: 0;left: 0;z-index: 2;position: absolute;background: white;clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);">' +
        '  <div class="user-avatar-progress" style="top: 0;left: 0;z-index: 3;position: absolute;"></div>' +
        '</div>' +
        '</div>' +
        '</a>' +
        '<p class="chat-widget-speaker-message" style="border-top-left-radius: 0; display: inline-block;padding: 12px;border-radius: 10px;background-color: #f5f5fa;font-size: 0.875rem;font-weight: 600; line-height: 1.1428571429em;width: fit-content; max-width: 250px; word-wrap: break-word; white-space: normal ;color: #3e3f5e;font-family: Helvetica, Arial, sans-serif;margin: 0;">' +
        message +
        '</p>' +
        '<p class="chat-widget-speaker-timestamp" style="margin-top: 12px !important;color: #adafca;font-size: 0.75rem;font-weight: 500;font-family: Helvetica, Arial, sans-serif;line-height: 1em;margin: 0;">'
        + this.getCurrentTime() + '</p>' +
        '</div>	'
      );
      this.scrollToBottom();
    }, 1500);
  }

  scrollToBottom() {
    this.$chatHistory = $('.chat-widget-conversation');
    this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
  }

  getCurrentTime() {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
  }

  customTime(time: string) {
    if (time == '')
      return '';
    let dateTime = '';
    let date1 = new Date(time.substring(0, 10));
    let date2 = new Date();
    let day = date2.getDate(); // Lấy ngày trong tháng (1-31)
    let month = date2.getMonth() + 1; // Lấy tháng (0-11), nên cộng thêm 1
    let year = date2.getFullYear();
    let date3 = new Date(year + '-' + month + '-' + day);
    if (date1 < date3) {
      dateTime = this.getDayOfWeek(time.substring(0, 10));
      return dateTime;
    } else if (date1 > date2) {
      return '';
    }
    else {
      let date = new Date();
      let date1 = new Date(time);


      // Lấy thời gian ở dạng milliseconds từ epoch (1/1/1970)
      let time1 = date.getTime();
      let time2 = date1.getTime();

      // Tính toán khoảng thời gian (đơn vị milliseconds)
      let timeDifference = Math.abs(time1 - time2); // Lấy giá trị tuyệt đối để đảm bảo giá trị luôn là dương

      // Chuyển khoảng thời gian thành giờ, phút, giây, và mili giây (tùy ý)
      let milliseconds = timeDifference % 1000;
      // let seconds = Math.floor((timeDifference / 1000) % 60);
      let minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      let hours = Math.floor((timeDifference / (1000 * 60 * 60)));
      if (hours == 0) {
        return minutes + 'p trước';
      } else {
        return hours + 'h trước';
      }
      // let regex = /(\d{2}:\d{2})/;
      // let match = time.match(regex);
      // if (match) {
      //   let extractedTime = match[1]; // Extracted "15:43"
      //   return extractedTime;
      // } else {
      //   return null;
      // }
    }
  }

  getDayOfWeek(dateString: string) {
    let dateTemp = new Date(dateString);
    var currentDate = new Date();

    // Tìm ngày đầu tiên trong tuần (ngày chủ nhật)
    let firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    // Tìm ngày cuối cùng trong tuần (ngày thứ bảy)
    let lastDayOfWeek = new Date(currentDate);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

    // Định dạng ngày thành chuỗi
    let startDate = firstDayOfWeek.toISOString().slice(0, 10);
    let endDate = lastDayOfWeek.toISOString().slice(0, 10);
    if (dateTemp > new Date(startDate) && dateTemp < new Date(endDate)) {
      let daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      // Tạo đối tượng Date từ chuỗi ngày
      let date = new Date(dateString);
      // Lấy thứ của ngày (0 = Chủ Nhật, 1 = Thứ Hai, 2 = Thứ Ba, v.v.)
      let dayOfWeek = date.getDay();
      // Trả về tên thứ
      return daysOfWeek[dayOfWeek];
    } else {
      return dateString.substring(0, 10).toString();
    }
  }


  // Getter - Setter
  getSender(): any[] {
    return this.sender;
  }
  setSender(data: any[]): void {
    this.sender = data;
  }

  getFriend(): any[] {
    return this.listFriends;
  }
  setFriend(data: any[]): void {
    this.listFriends = data;
  }

  getCheckConnected(): boolean {
    return this.checkConnected;
  }
  setCheckConnected(data: boolean): void {
    this.checkConnected = data;
  }

  getListMess(): any[] {
    return this.listMess;
  }
  setListMess(data: any[]): void {
    this.listMess = data;
  }
}