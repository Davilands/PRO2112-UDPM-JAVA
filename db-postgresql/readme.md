# Mô tả các thay đổi của DB
  * 12-9-2023 delete 2 column (get_report) in table Post and User
  * 19-9-2023 add 1 column (date_interested) in table Interested
  * 24-9-2023 add 2 data ('ROLE_OWNER', 'Người sở hữu web') and ('ROLE_MODERATOR', 'Kiểm duyệt viên web') in table User_role
  * 3-10-2023 add table message, chats, chat_participants
  * 6-10-2023 re-update data in db, change the sub column to gg_id and add column fb_id in the table users
      - add 49 post
      - add 26 user
      - change all the image column to image in firebase
  * 12-10-2023 add 3 column isFriend, hide, status in table chats and add data to table chats and chat_participants
  * 20-10-2023 add 2 table user_reported and post_reported, add 1 function
  * 23-10-2023 add create 1 table send_reciever with 4 column (send_reciever_id, post_id, user_id, date_send_reciever)
  * 2-11-2023 add create column parent_post_id in table post, create column date_follow in table follower and create function 
  *24-11-2023 create table messages_images and table comment_user_mention


