import 'dart:async';
import 'dart:convert';

import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/container.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:login_signup/models/SocketManager%20.dart';
import 'package:login_signup/utils/api.dart';
import 'package:login_signup/utils/gobal.colors.dart';
import 'package:login_signup/view/edit_profile.view.dart';
import 'package:login_signup/view/login_signup_screen.dart';
import 'package:login_signup/view/widgets/button_screen.dart';
import 'package:login_signup/view/widgets/post.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/cupertino.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';

class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

late SocketManager socketManager = SocketManager();
String? ava;
String? fullname;
int? countPost;
int? countFollower;
int? countImg;
Map? listPost;
int? user;

class _ProfileViewState extends State<ProfileView> {
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    getConnectivity();
    this.checkUser();
    this.getData();
  }

  late StreamSubscription subscription;
  var isDeviceConnected = false;
  bool isAlertSet = false;

  Future<void> getConnectivity() async {
    subscription = Connectivity()
        .onConnectivityChanged
        .listen((ConnectivityResult event) async {
      isDeviceConnected = await InternetConnectionChecker().hasConnection;
      if (!isDeviceConnected && !isAlertSet) {
        showDialogBox();
        setState(() => isAlertSet = true);
      } else if (isDeviceConnected && isAlertSet) {
        setState(() => isAlertSet = false);
      }
    });
  }

  @override
  void dispose() {
    subscription.cancel();
    super.dispose();
  }

  void showDialogBox() {
    showCupertinoDialog<String>(
      context: context,
      builder: (BuildContext context) => CupertinoAlertDialog(
        title: const Text("Không có kết nối"),
        content: const Text("Vui lòng kiểm tra kết nối internet"),
        actions: <Widget>[
          TextButton(
            onPressed: () async {
              Navigator.pop(context, 'Cancel');
              isDeviceConnected =
                  await InternetConnectionChecker().hasConnection;
              if (!isDeviceConnected) {
                showDialogBox();
                setState(() => isAlertSet = true);
              }
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void checkUser() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    var id = await prefs.getInt('id');
    setState(() {
      user = id;
    });
  }

  Future getData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    var value = await prefs.getString('token');
    var headers = {
      'Authorization': ' Bearer $value',
      'Content-Type':
          'application/json', // Điều này phụ thuộc vào yêu cầu cụ thể của máy chủ
    };
    var id_user = await prefs.getInt('id');
    String requestBody = id_user.toString();

    http.Response response;

    setState(() {
      isLoading = true; // Hiển thị loading indicator khi bắt đầu tải dữ liệu
    });
    response = await http.post(
        Uri.parse(ApiEndPoints.baseUrl + "v1/user/profile/data/header"),
        headers: headers,
        body: requestBody);
    if (response.statusCode == 200) {
      setState(() {
        Map<String, dynamic> data =
            jsonDecode(Utf8Decoder().convert(response.bodyBytes));
        // ava = data['avatar'];
        // fullname = data['fullname'];
        // countPost = data['countPost'];
        // countFollower = data['countFollower'];
        // countImg = data['countImg'];
        listPost = data;
        // print(listPost);
      });
    }
    Future.delayed(Duration(seconds: 3), () {
      setState(() {
        isLoading = false; // Ẩn loading indicator sau khi dữ liệu đã được tải
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("Trang cá nhân"),
          backgroundColor: Colors.white,
          elevation: 0,
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: PopupMenuButton(
                itemBuilder: (context) => [
                  PopupMenuItem(
                      onTap: () async {
                        SharedPreferences prefs =
                            await SharedPreferences.getInstance();
                        var value = await prefs.getString('token');
                        var id = await prefs.getInt('id');
                        var headers = {
                          'Authorization': 'Bearer $value',
                          'Content-Type': 'application/json',
                        };
                        http.Response response;
                        response = await http.get(
                          Uri.parse(
                              ApiEndPoints.baseUrl + "v1/user/logout/chat/$id"),
                          headers: headers,
                        );
                        if (response.statusCode == 200) {
                          socketManager.logout();
                          await prefs.clear();
                          runApp(GetMaterialApp(
                            home: HomeScreen(),
                          ));
                        }
                      },
                      child: Row(
                        children: [
                          Icon(Icons.logout),
                          Padding(
                              padding: EdgeInsets.only(left: 10.0),
                              child: Text("Đăng xuất"))
                        ],
                      ))
                ],
                child: Icon(
                  Icons.more_vert,
                  color: GlobalColors.mainColor,
                ),
              ),
            )
          ],
        ),
        body: Stack(children: <Widget>[
          SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 55),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            CircleAvatar(
                              radius: 50,
                              backgroundImage: listPost?['avatar'] != null
                                  ? NetworkImage(listPost!['avatar'])
                                  : NetworkImage(
                                      'https://firebasestorage.googleapis.com/v0/b/destiny-davisy.appspot.com/o/daviuser.png?alt=media&token=2d59b1a7-5ce8-4d5a-96f6-17b32a620b51&_gl=1*1g5m6wy*_ga*MTcxMDU3NTczOS4xNjc2OTc2NjE1*_ga_CW55HF8NVT*MTY5NjUwMzgxNi44LjEuMTY5NjUwNTk0MC4xNy4wLjA.'),
                            ),
                            InkWell(
                              onTap: () {
                                runApp(GetMaterialApp(
                                  home: EditProfile(),
                                ));
                              },
                              child: CircleAvatar(
                                radius: 12,
                                backgroundColor: GlobalColors.mainColor,
                                child: const Icon(
                                  Icons.edit,
                                  size: 15,
                                  color: Colors.white,
                                ),
                              ),
                            )
                          ],
                        ),
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text(
                            listPost?['fullname'] ?? '',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              children: [
                                Text(
                                  (listPost?['countPost'] ?? '').toString(),
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(
                                  height: 10,
                                ),
                                Text(
                                  "Bài đăng",
                                  style: Theme.of(context)
                                      .textTheme
                                      .subtitle1!
                                      .copyWith(color: Colors.grey[400]),
                                )
                              ],
                            ),
                            Column(
                              children: [
                                Text(
                                  (listPost?['countFollower'] ?? '').toString(),
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(
                                  height: 10,
                                ),
                                Text(
                                  "Theo dõi",
                                  style: Theme.of(context)
                                      .textTheme
                                      .subtitle1!
                                      .copyWith(color: Colors.grey[400]),
                                )
                              ],
                            ),
                            Column(
                              children: [
                                Text(
                                  (listPost?['countImg'] ?? '').toString(),
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(
                                  height: 10,
                                ),
                                Text(
                                  "Ảnh",
                                  style: Theme.of(context)
                                      .textTheme
                                      .subtitle1!
                                      .copyWith(color: Colors.grey[400]),
                                )
                              ],
                            )
                          ],
                        ),
                        SizedBox(
                          height: 20,
                        ),
                        user == listPost?['user_id']
                            ? SizedBox(
                                height: 10,
                              )
                            : ButtonCustom(
                                customCorlor: GlobalColors.mainColor,
                                text: listPost?['checkFollow'] == true
                                    ? "Bỏ theo dõi"
                                    : "Theo dõi",
                                onTap: () {}),
                        SizedBox(
                          height: 10,
                        )
                      ],
                    ),
                  ),
                ),
                Post(),
                SizedBox(
                  height: 80,
                )
              ],
            ),
          ),
          isLoading
              ? Container(
                  color: Colors.black.withOpacity(0.5),
                  child: Center(
                    child: SpinKitWave(
                      color: Colors.white,
                      size: 50.0,
                    ),
                  ),
                )
              : SizedBox(),
        ]));
  }
}
