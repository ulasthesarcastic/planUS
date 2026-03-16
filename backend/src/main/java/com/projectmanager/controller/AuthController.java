package com.projectmanager.controller;

import com.projectmanager.model.User;
import com.projectmanager.security.JwtUtil;
import com.projectmanager.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        return userService.getByUsername(username)
            .filter(u -> u.isActive() && userService.checkPassword(password, u.getPassword()))
            .map(u -> ResponseEntity.ok(Map.of(
                "token", jwtUtil.generateToken(u.getUsername(), u.getRole().name()),
                "user", Map.of("id", u.getId(), "username", u.getUsername(),
                               "fullName", u.getFullName(), "role", u.getRole())
            )))
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Kullanıcı adı veya şifre hatalı.")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtUtil.extractUsername(token);
        return userService.getByUsername(username)
            .map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(), "username", u.getUsername(),
                "fullName", u.getFullName(), "role", u.getRole()
            )))
            .orElse(ResponseEntity.notFound().build());
    }
}
