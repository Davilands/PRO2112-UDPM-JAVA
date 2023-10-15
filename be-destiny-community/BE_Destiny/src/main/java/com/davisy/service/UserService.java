package com.davisy.service;

import java.util.List;

import org.springframework.scheduling.annotation.Async;

import com.davisy.entity.Roles;
import com.davisy.entity.User;

public interface UserService {
	User findByEmailAndPassword(String email, String password);

	User findByEmail(String email);

	List<Integer> findAllUserProvinces(String idPr, String idDt, String idW);

	User findById(int id);

	User findByFbId(String fb_id);

	User findByGgId(String gg_id);

	List<User> findAll();

	List<Object[]> getTOP5User();

	// 21-9-2023 -lấy tổng số người dùng theo tháng
	// lastest update 14-10
	public int getTotalUserByMonth(int month);

	// 21-9-2023 -Tóng số lượng tương tác của người dùng theo từng tháng
	public List<Object[]> getInteractionOfUser();

	// lastest update 14-10 Tóng số lượng tương tác của người dùng theo tháng
	public int getInteractionOfUserByMonth(int month);

	// 21-9-2023 -Top 4 người dùng đăng bài nhiều nhất
	public List<Object[]> getTOP4User();

	// 22-0-2023 -Tổng số người dùng tham gia từng theo từng tháng
	public List<Object[]> getTotalUserEveryMonth();

	public void create(User user);

	public void update(User user);

	public void disable(User user);

	public void delete(User user);

}