package com.davisy.service;

import java.util.List;

import com.davisy.entity.PostImages;

public interface PostImagesService {

	public int countPostImages(int id);

	// 22-9-2023 -lấy tổng ảnh của bài đăng
	public List<PostImages> getListPostImagesByPostID(int id);
}