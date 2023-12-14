package com.davisy.controller.admin;

import jakarta.annotation.security.RolesAllowed;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.davisy.config.JwtTokenUtil;
import com.davisy.constant.Cache;
import com.davisy.controller.ProfileContronller;
import com.davisy.controller.admin.EmailChange;
import com.davisy.controller.admin.EmailConfirm;
import com.davisy.dto.Admin;
import com.davisy.dto.AdminPassword;
import com.davisy.entity.Districts;
import com.davisy.entity.Gender;
import com.davisy.entity.Provinces;
import com.davisy.entity.User;
import com.davisy.entity.Wards;
import com.davisy.service.CacheService;
import com.davisy.service.DistrictService;
import com.davisy.service.EmailService;
import com.davisy.service.GenderService;
import com.davisy.service.ProvinceService;
import com.davisy.service.UserService;
import com.davisy.service.WardService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@CrossOrigin("*")
@RolesAllowed("ROLE_ADMIN")
public class AdminControlProfile {
	@Autowired
	private UserService userService;
	@Autowired
	private GenderService genderService;
	@Autowired
	private ProvinceService provinceService;
	@Autowired
	private DistrictService districtService;
	@Autowired
	private WardService wardService;
	@Autowired
	private JwtTokenUtil jwtTokenUtil;
	@Autowired
	private PasswordEncoder passwordEncoder;

	String provinceCode;
	String districtCode;

	@Autowired
	CacheService cacheService;
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

	@Autowired
	SimpMessagingTemplate simpMessagingTemplate;

	@Autowired
	ObjectMapper mapper;

	@Autowired
	EmailService emailService;

	String randCodeAuth = "";
	@Value("${davis.client.uri}")
	String client;

	// 8-11
	@PostMapping("/v1/admin/profile/change/email")
	public ResponseEntity<String> changeEmail(@RequestBody EmailChange change, HttpServletRequest request)
			throws MessagingException {

		String email = jwtTokenUtil.getEmailFromHeader(request);
		User currentUser = userService.findByEmail(email);

		if (!passwordEncoder.matches(change.getPassword(), currentUser.getPassword())) {
			return ResponseEntity.status(300).body(null); // "Mật khẩu xác nhận không đúng"
		}

		if (currentUser.getEmail().equalsIgnoreCase(change.getNewEmail())) {
			return ResponseEntity.status(301).body(null); // "Email mới trùng với email cũ"
		}

		// currentUser.setEmail(change.getNewEmail());

		// userServiceImpl.update(currentUser);
		this.randCodeAuth = ProfileContronller.random();

		EmailConfirm eConfirm = new EmailConfirm(currentUser.getEmail(), change.newEmail, change.getPassword());

		// {key: "change:email", value: "newMail", time 5m}
		cacheService.writeCacheAtTime("changemail:" + this.randCodeAuth, eConfirm, 5, Cache.TimeUnit_MINUTE);

		// Gửi mail
		/*
		 * 
		 * BUTTON click :
		 * http://localhost:4200/chang-email-confirm?code=this.randCodeAuth => call api
		 * GET: /v1/user/profile/change/email?code=this.randCodeAuth
		 * 
		 */
		emailService.sendHtmlEmail(client + "/chang-email-confirm" + "?code=" + this.randCodeAuth, change.newEmail);
		return ResponseEntity.status(200).body(this.randCodeAuth); // "OK"
	}

	// update lastest 9-10
	@GetMapping("/v1/admin/checkAdminLog")
	public ResponseEntity<Admin> checkAdminLog(HttpServletRequest request) {

		String email = jwtTokenUtil.getEmailFromHeader(request);
		User user = userService.findByEmail(email);
		Admin admin = new Admin();
		admin.setAvatar(user.getAvatar());

		return ResponseEntity.status(200).body(admin);
	}

	// 22-9-2023 -Thông tin chi tiết của admin
	// update lastest 10-10
	@GetMapping("/v1/admin/profile")
	public ResponseEntity<Admin> adminProfile(HttpServletRequest request) {

		String email = jwtTokenUtil.getEmailFromHeader(request);
		User user = userService.findByEmail(email);
		Admin admin = new Admin();

		admin.setUsername(user.getUsername());

		String auth = String.valueOf(user.getAuthorities());
		String authName = auth.substring(6, auth.length() - 1).toLowerCase();
		char capitalFirstLetter = Character.toUpperCase(authName.charAt(0));
		String authNameUp1Char = authName.replace(authName.charAt(0), capitalFirstLetter);

		admin.setAuthorities(authNameUp1Char);

		admin.setFullname(user.getFullname());
		admin.setEmail(user.getEmail());
		admin.setIntro(user.getIntro());

		Calendar birthday = user.getBirthday();

		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		SimpleDateFormat formatVN = new SimpleDateFormat("dd-MM-yyyy");

		String formatted = format.format(birthday.getTime());
		String formattedVN = formatVN.format(birthday.getTime());

		admin.setBirthday(formatted);
		admin.setBirthdayFormat(formattedVN);

		admin.setProvince_name(user.getProvinces().getFull_name());
		admin.setDistrict_name(user.getDistricts().getFull_name());
		admin.setWard_name(user.getWards().getFull_name());

		admin.setGender_name(user.getGender().getGender_name());
		admin.setAvatar(user.getAvatar());
		admin.setThumb(user.getThumb());

		return ResponseEntity.status(200).body(admin);
	}

	// update lastest 11-10
	@GetMapping("/v1/admin/getAllGender")
	public ResponseEntity<List<String>> getAllGender() {
		try {
			List<Object[]> list = genderService.getAllGenderName();
			List<String> listGender = new ArrayList<>();

			for (Object[] oj : list) {
				String gender = String.valueOf(oj[0]);
				listGender.add(gender);
			}
			return ResponseEntity.status(200).body(listGender);
		} catch (Exception e) {
			System.out.println("Error at admin/getAllGenders: " + e);
			return ResponseEntity.status(403).body(null);
		}
	}

	// update lastest 11-10
	@GetMapping("/v1/admin/getAllProvinceName")
	public ResponseEntity<List<String>> getAllProvinceName() {
		try {
			List<Object[]> list = provinceService.getAllProvinceName();
			List<String> listProvince = new ArrayList<>();

			for (Object[] oj : list) {
				String province = String.valueOf(oj[0]);
				listProvince.add(province);
			}
			return ResponseEntity.status(200).body(listProvince);
		} catch (Exception e) {
			System.out.println("Error at admin/getAllProvinceName: " + e);
			return ResponseEntity.status(403).body(null);
		}
	}

	// update lastest 11-10
	@GetMapping("/v1/admin/getAllDistrictName/{provinceName}")
	public ResponseEntity<List<String>> getAllDistrictName(@PathVariable String provinceName) {
		try {
			provinceCode = provinceService.provinceCode(provinceName);
			List<Object[]> list = new ArrayList<>();

			if (provinceCode == null) {
				list = districtService.getAllDistrict();
			} else {
				list = districtService.getAllDistrictName(provinceCode);
			}
			List<String> listDistrict = new ArrayList<>();

			for (Object[] oj : list) {
				String district = String.valueOf(oj[0]);
				listDistrict.add(district);
			}
			return ResponseEntity.status(200).body(listDistrict);
		} catch (Exception e) {
			System.out.println("Error at admin/getAllDistrictName: " + e);
			return ResponseEntity.status(403).body(null);
		}
	}

	// update lastest 11-10
	@GetMapping("/v1/admin/getAllWardName/{districtName}")
	public ResponseEntity<List<String>> getAllWardName(@PathVariable String districtName) {
		try {
			districtCode = districtService.districtCode(districtName, provinceCode);
			List<Object[]> list = new ArrayList<>();

			if (provinceCode == null || districtCode == null) {
				list = wardService.getAllWard();
			} else {
				list = wardService.getAllWardName(districtCode);
			}
			List<String> listDistrict = new ArrayList<>();

			for (Object[] oj : list) {
				String district = String.valueOf(oj[0]);
				listDistrict.add(district);
			}
			return ResponseEntity.status(200).body(listDistrict);
		} catch (Exception e) {
			System.out.println("Error at admin/getAllDistrictName: " + e);
			return ResponseEntity.status(403).body(null);
		}
	}

	// 22-9-2023 Cập nhật thông tin tài khoản admin
	// 12-10-2023 lastest update
	@PostMapping("/v1/admin/updateProfile")
	public ResponseEntity<User> updateProfileAdmin(@RequestBody Admin adminRequestUpdate, HttpServletRequest request)
			throws Exception {
		try {
			String email = jwtTokenUtil.getEmailFromHeader(request);
			User admin = userService.findByEmail(email);
			boolean existUsername = false;
			List<User> userAll = userService.findAll();
			for (User u : userAll) {
				if (adminRequestUpdate.getUsername().equals(u.getUsername())) {
					if (!adminRequestUpdate.getUsername().equals(admin.getUsername())) {
						existUsername = true;// trùng tên dn
					}
				}
			}

			if (existUsername == false) {
				admin.setUsername(adminRequestUpdate.getUsername());
				admin.setFullname(adminRequestUpdate.getFullname());
				admin.setIntro(adminRequestUpdate.getIntro());

				admin.setAvatar(adminRequestUpdate.getAvatar());

				admin.setThumb(adminRequestUpdate.getThumb());

				SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
				Date date = sdf.parse(adminRequestUpdate.getBirthday());
				Calendar birthday = Calendar.getInstance();
				birthday.setTime(date);

				admin.setBirthday(birthday);

				int genderID = genderService.findIDGenderByName(adminRequestUpdate.getGender_name());
				Gender gender = genderService.findGenderByID(genderID);
				admin.setGender(gender);

				String provinceCode = provinceService.provinceCode(adminRequestUpdate.getProvince_name());
				Provinces province = provinceService.findProvinceByID(provinceCode);
				admin.setProvinces(province);

				String districtCode = districtService.districtCode(adminRequestUpdate.getDistrict_name(), provinceCode);
				Districts district = districtService.findDistrictByID(districtCode);
				admin.setDistricts(district);

				String wardCode = wardService.wardCode(adminRequestUpdate.getWard_name(), districtCode);
				Wards ward = wardService.findWardByID(wardCode);
				admin.setWards(ward);

				userService.update(admin);

				return ResponseEntity.status(200).body(admin);
			}else {
//				System.out.println("Trung ten dn roi ma");
				return ResponseEntity.status(301).body(admin); 
			}
		} catch (Exception e) {
			System.out.println("Lỗi nè admin/update profile: " + e);
			throw e;
		}
	}

	// 22-9-2023 Kiểm tra mật khẩu khớp với mật khẩu cũ
	// 14-10-2023 lastest update
	@PostMapping("/v1/admin/checkPassword")
	public int checkPassword(@RequestBody AdminPassword userRequestChangePasswrod, HttpServletRequest request)
			throws Exception {
		try {
			int status;
			String email = jwtTokenUtil.getEmailFromHeader(request);
			User admin = userService.findByEmail(email);
			String passwordRequest = userRequestChangePasswrod.getOldPassword();

			if (passwordEncoder.matches(passwordRequest, admin.getPassword())) {
				status = 1;
			} else {
				status = 0;
			}
			return status;
		} catch (Exception e) {
			System.out.println("Lỗi nè admin/checkPassword: " + e);
			throw e;
		}
	}

	// 22-9-2023 Cập nhật mật khẩu mới
	// 14-10-2023 lastest update
	@PostMapping("/v1/admin/changePassword")
	public void changePassword(@RequestBody AdminPassword adminRequestChangePasswrod, HttpServletRequest request)
			throws Exception {
		try {
			System.out.println(adminRequestChangePasswrod.getNewPassword());
			String email = jwtTokenUtil.getEmailFromHeader(request);
			User admin = userService.findByEmail(email);
			String newPassword = adminRequestChangePasswrod.getNewPassword();
			admin.setPassword(passwordEncoder.encode(newPassword));

			userService.update(admin);
		} catch (Exception e) {
			System.out.println("Lỗi nè admin/changePassword: " + e);
		}
	}

}

@Data
@NoArgsConstructor
@AllArgsConstructor
class EmailChange {
	String newEmail;
	String password;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class EmailConfirm {
	String oldEmail;
	String newEmail;
	String currentPassword;
}
