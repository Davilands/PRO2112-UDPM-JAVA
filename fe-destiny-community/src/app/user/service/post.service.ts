import { Injectable } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import '../../../assets/toast/main.js';
declare var toast: any;
import { BehaviorSubject } from 'rxjs'; //Theo dõi trạng thái của modal
import { environment } from '../../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class PostService {
  private loadDataTop5Post = environment.baseUrl + 'v1/user/getTop5Post';
  private loadDataTop5User = environment.baseUrl + 'v1/user/getTop5User';

  private loadDataPosts = environment.baseUrl + 'v1/user/load/post';
  private createPostUrl = environment.baseUrl + 'v1/user/upload/post';
  private loadDataUpdatePostUrl = environment.baseUrl + 'v1/user/load/data/post/update';
  private updatePostUrl = environment.baseUrl + 'v1/user/data/update/post';

  private listTop5User: any[] = [];
  private listTop5Post: any[] = [];
  private listPostsNf: any;
  public postUpdate: any;
  listImageSources: any[] = [];
  infoPost: any

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  /* ============Top 5============= */
  async loadTop5User(): Promise<any[]> {
    try {
      const response = await this.http.get<any>(this.loadDataTop5User).toPromise();
      this.listTop5User = JSON.parse(JSON.stringify(response));
      this.setDataTop5User(this.listTop5User);
      return this.listTop5User;
    } catch (error) {
      throw error;
    }
  }

  async loadTop5Post(): Promise<any[]> {
    try {
      const response = await this.http.get<any>(this.loadDataTop5Post).toPromise();
      this.listTop5Post = JSON.parse(JSON.stringify(response));
      this.setDataTop5Post(this.listTop5Post);
      return this.listTop5Post;
    } catch (error) {
      throw error;
    }
  }

  /* ============Posts newsfeed============= */
  // async loadPostNewsFeed(): Promise<any[]> {
  //   try {
  //     const response = await this.http.get<any>(this.loadDataPosts).toPromise();
  //     this.setDataPostNf(response);
  //     return response;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  loadPostNewsFeed(data: any): Observable<any> {
    return this.http.post(this.loadDataPosts, data).pipe(
      tap((response) => {
        this.setDataPostNf(response);
      }),
    )
  }
  /* ============upload post============= */
  uploadPost(data: any): Observable<any> {
    return this.http.post(this.createPostUrl, data).pipe(
      tap((response) => {
        this.setDataPostNf(response);
      }),
    )
  }

  /* ============update post============= */
  private isOpenUpdatePost = new BehaviorSubject<boolean>(false);
  isOpenUpdatePost$ = this.isOpenUpdatePost.asObservable();
  listImgTemp:string[] = [];
  openModalUpdatePost(idPost) {
    this.isOpenUpdatePost.next(true);
    try {
      this.loadDataUpdate(idPost).subscribe((res) => {
        this.postUpdate = res;
        this.infoPost = this.postUpdate[0];
        this.listImageSources = this.infoPost.postImages;

        this.listImgTemp = this.listImageSources;
        console.log("this.listPostUdpate: " + JSON.stringify(this.postUpdate[1]));
      })
    } catch (error) {
      console.error('Error:', error);
    }
  }

  closeModalUpdatePost() {
    this.listImgTemp = this.listImageSources;
    this.isOpenUpdatePost.next(false);
  }

  loadDataUpdate(data: any) {
    return this.http.post<any[]>(this.loadDataUpdatePostUrl, data).pipe(
      tap((response) => {
        this.postUpdate = response;
        this.setDataPostUpdate(this.postUpdate);
      }),
    );
  }

  updatePost(data: any): Observable<any> {
    return this.http.post(this.updatePostUrl, data).pipe(

    )
  }
  
  /* ============Interested============= */
  private likedPosts: Set<string> = new Set<string>();

  toggleLike(postId: string): void {
    if (this.likedPosts.has(postId)) {
      this.likedPosts.delete(postId);
    } else {
      this.likedPosts.add(postId);
    }
  }

  isLiked(postId: string): boolean {
    return this.likedPosts.has(postId);
  }
  /* ============Getter - Setter============= */
  getDataTop5User(): any[] {
    return this.listTop5User;
  }
  setDataTop5User(data: any[]): void {
    this.listTop5User = data;
  }
  getDataTop5Post(): any[] {
    return this.listTop5Post;
  }
  setDataTop5Post(data: any[]): void {
    this.listTop5Post = data;
  }
  getDataPostNf(): any {
    return this.listPostsNf;
  }
  setDataPostNf(data: any): void {
    this.listPostsNf = data;
  }
  getDataPostUpdate(): any {
    return this.postUpdate;
  }
  setDataPostUpdate(data: any): void {
    this.postUpdate = data;
  }
}
