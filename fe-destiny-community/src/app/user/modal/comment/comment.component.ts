import { Component, ElementRef, Renderer2, HostListener } from '@angular/core';

import { ModalService } from '@app/user/service/modal.service';
import { PostService } from '@app/user/service/post.service';
import { FollowsService } from '@app/user/service/follows.service';
import { ProfileService } from '@app/user/service/profile.service';
import { UIServiveService } from '@app/user/service/ui-servive.service';
import { ReportService } from '@app/user/service/report.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: [
    './comment.component.css'
  ]
})
export class CommentComponent {
  slideIndex: number = 1;
  slidesLength: string;
  // dropdownItems = ['Nguyễn Văn A', 'Phan Nguyễn Hải Yến', 'Nguyễn Văn C','Nguyễn Văn D', 'Đào Ngọc Hân', 'Nguyễn Văn F'];
  filteredItems: any[] = [];
  listFriend: any[];
  listFriendTemp: any[];
  nameReply: any;
  idUserCmt: any;

  constructor(
    public modalService: ModalService,
    public postService: PostService,
    public followsService: FollowsService,
    public profileService: ProfileService,
    private uiServiveService: UIServiveService,
    public reportService: ReportService,
    private el: ElementRef, 
    private renderer: Renderer2
  ) {
    this.idUserCmt = localStorage.getItem('chatUserId');
    document.addEventListener('click', (event) => {
      const targetElement = event.target as HTMLElement;
    
      // Kiểm tra nếu phần tử được nhấp không thuộc menu dropdown
      if (!targetElement.closest('.dropdown')) {
        // Đóng tất cả menu dropdown
        this.closeAllDropdowns();
      }
    });
   }

  ngOnInit() {
    this.showSlides(1);
    this.loadFriend();
    this.checkScroll();
    this.uiServiveService.loadMode();
    this.idUserCmt = localStorage.getItem('chatUserId');
  }

  checkCountPosts: boolean = true;
  checkLoadingdata: boolean = true;
  currentPage: number = 1;
  async checkScroll() {
    const scrollableDiv = document.getElementById('scrollableDiv')!;

    scrollableDiv.addEventListener('scroll', async () => {
      let epsilon = '0';
      if (scrollableDiv.scrollTop.toString().indexOf('.') > 0) {
        epsilon = '0' + scrollableDiv.scrollTop.toString().substring(scrollableDiv.scrollTop.toString().indexOf('.'));
      }
      if (
        scrollableDiv.scrollHeight - scrollableDiv.clientHeight - (scrollableDiv.scrollTop - parseFloat(epsilon)) <= 1 &&
        this.checkCountPosts
      ) {
        this.checkLoadingdata = true;
        try {
          this.currentPage++;
          // const data: any = await this.postService.loadPostNewsFeed(this.currentPage).toPromise();
          // this.listPosts = [...this.listPosts, ...data];
          this.checkLoadingdata = false;
          // if (data.length < 5) {
          //   this.checkCountPosts = false;
          //   this.checkLoadingdata = false;
          // }
          // console.log("data.length: " + data.length);
        } catch (error) {
          // console.error("Error loading data:", error);
        }

        // console.log("hết nè: ");

      }
    });
  }
  /* ============Add comment============= */
  $contentCommnet: any;
  idPost: any;
  idUser: any;
  checkNullCmt: boolean = false;
  comment_input: string = '';
  addComment() {
    this.$contentCommnet = $('#comment-input');
    this.idPost = this.modalService.idPostCmt;
    this.idUser = this.modalService.idUser;
    if (this.$contentCommnet.val() != null && this.comment_input != '') {
      // this.comment_input = this.modalService.getContent(item.fullname, this.comment_input)
      let type = (this.modalService.repCmtId > 0) ? 'REPCOMMENT' : 'COMMENT';
      this.modalService.sendNotify(this.$contentCommnet.val(), this.idPost, this.idUser, type, this.modalService.repCmtId);
    }
    // if(this.comment_input != ''){
    //   this.checkNullCmt = true;
    // }
    this.comment_input = '';
  }

  
  
  /* ============template============= */
  removeSeeMoreCmt(idCmt) {
    this.modalService.checkHideSeeMore.set(idCmt, true);
    document.querySelectorAll(".rep-" + idCmt).forEach((e) => {
      e.remove();
    });
  }

  plusSlides(n: number) {
    this.showSlides(this.slideIndex += n);
  }

  showSlides(n: number) {
    let i: number;
    let slides: HTMLCollectionOf<Element> = document.getElementsByClassName("mySlides");
    const numberText = document.getElementById("numbertext")!;

    this.slidesLength = slides.length.toString();
    // Kiểm tra nếu slideIndex vượt quá giới hạn
    if (n > slides.length) {
      this.slideIndex = 1;
    }
    if (n < 1) {
      this.slideIndex = slides.length;
    }

    // Ẩn tất cả các slides
    for (i = 0; i < slides.length; i++) {
      (slides[i] as HTMLElement).style.display = "none";
    }
    // Kiểm tra slideIndex có hợp lệ trước khi hiển thị slide và dot tương ứng
    if (this.slideIndex >= 1 && this.slideIndex <= slides.length) {
      (slides[this.slideIndex - 1] as HTMLElement).style.display = "block";
      numberText.textContent = this.slideIndex.toString();
    }
  }

  closeModalComment() {
    this.modalService.closeModalComment();
    this.modalService.repCmtId = 0;
    this.modalService.mapMention.clear();

  }

  reply(idCmt: any, name: string) {
    this.comment_input = `${name}`;
    this.modalService.repCmtId = idCmt;
    this.nameReply = name;
    const input = document.getElementById("comment-input");
    if (input) {
      input.focus();
    }
  }

  async loadFriend() {
    this.listFriend = await this.followsService.loadDataFriends();
    this.listFriendTemp = JSON.parse(JSON.stringify(this.listFriend))
  }

  showDropdown: boolean = false;
  onInput(event: any) {
    // Kiểm tra nếu nội dung của trường input trống, đặt repCmtId và idMention thành 0
    if (this.comment_input === '') {
      this.modalService.repCmtId = 0;
      this.modalService.mapMention.clear();
    } else {
      for (let [key, value] of this.modalService.mapMention) {
        if (!this.comment_input.includes(value)) {
          this.modalService.mapMention.delete(key);
          // console.warn("length: " + this.modalService.mapMention.size);
        }
      }
    }

    if(!this.comment_input.includes(this.nameReply)){
      this.modalService.repCmtId = 0;
      this.nameReply = null;
    }

    // Kiểm tra nếu nội dung trường input chứa ký tự "@" hoặc dropdown đã hiển thị
    if (this.comment_input.includes('@') || this.showDropdown) {
      this.showDropdown = true;
      this.filterDropdown();
    } else {
      this.showDropdown = false;
    }

  }

  selectItem(item: any) {
    if (this.comment_input.includes('@')) {
      // xóa '@' và thêm item vào cuối chuỗi
      this.comment_input = this.comment_input.replace('@', `${item.fullname} `);
    } else {
      this.comment_input = `${item.fullname} `;
    }
    this.modalService.mapMention.set(item.user_id, item.fullname);
    this.showDropdown = false;
    const input = document.getElementById("comment-input");
    if (input) {
      input.focus();
    }
    
  }

  filterDropdown() {
    const searchTerm = this.comment_input.toLowerCase().trim();

    if (searchTerm.includes('@') && searchTerm.length > 0) {
      const searchQuery = searchTerm.substring(searchTerm.indexOf('@') + 1);
      this.filteredItems = this.listFriendTemp.filter(item =>
        item.fullname.toLowerCase().includes(searchQuery)
      );
      this.showDropdown = this.filteredItems.length > 0;
    } else {
      this.showDropdown = false;
    }
  }

  toggleDropdown(id) {
    this.closeAllDropdowns();
    const dropdown = document.getElementById(`myDropdown-${id}`);
    if (dropdown) {
      dropdown.classList.toggle("show");
    }
  }

  closeAllDropdowns() {
    // Lấy tất cả các menu và đóng chúng
    const allDropdowns = document.querySelectorAll(".dropdown-menu-arrow");
    allDropdowns.forEach((dropdown) => {
      if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
      }
    });
  }

  removeCmt(idCmt) {
    this.closeAllDropdowns();
    let id = parseInt(idCmt, 10);
    this.modalService.removeCmtApi(id).subscribe();
  }
}




