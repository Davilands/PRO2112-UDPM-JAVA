package com.davisy.auth;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticationResponse {
	String name;
	Collection<SimpleGrantedAuthority> roles = new ArrayList<>();
	int id;
	String avatar;
	String token;
	String refreshToken;
}