export interface NotifyModel {
    avatar: string;
    fullname: string;
    fromUserId: number;
    content: string;
    postId: number;
    time: string;
    type: MessageType;
    following_status: boolean;
    status:boolean
  }
  
  export enum MessageType {
    COMMENT, REPCOMMENT,MENTION , INTERESTED, FOLLOW, SHARE,POST
  }
  // export enum MessageType {
  //   COMMENT = 'COMMENT', 
  //   INTERESTED = 'INTERESTED',
  //   FOLLOW = 'FOLLOW',
  //   SHARE = 'SHARE'
  // }