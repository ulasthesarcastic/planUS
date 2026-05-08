package com.projectmanager.controller;

import com.projectmanager.model.User;
import com.projectmanager.security.JwtUtil;
import com.projectmanager.service.LoginAttemptService;
import com.projectmanager.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;

    public AuthController(UserService userService, JwtUtil jwtUtil, LoginAttemptService loginAttemptService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");

        if (username.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Kullanıcı adı zorunludur."));
        }

        // Brute-force kontrolü
        if (loginAttemptService.isBlocked(username)) {
            long mins = loginAttemptService.remainingMinutes(username);
            return ResponseEntity.status(429).body(Map.of(
                "error", "Çok fazla başarısız deneme. " + mins + " dakika sonra tekrar deneyin."
            ));
        }

        var userOpt = userService.getByUsername(username)
            .filter(u -> u.isActive() && userService.checkPassword(password, u.getPassword()));

        if (userOpt.isEmpty()) {
            loginAttemptService.loginFailed(username);
            return ResponseEntity.status(401).body(Map.of("error", "Kullanıcı adı veya şifre hatalı."));
        }

        User u = userOpt.get();
        loginAttemptService.loginSucceeded(username);
        return ResponseEntity.ok(Map.of(
            "token", jwtUtil.generateToken(u.getUsername(), u.getRole().name()),
            "user", Map.of(
                "id",            u.getId(),
                "username",      u.getUsername(),
                "fullName",      u.getFullName(),
                "role",          u.getRole(),
                "portfolioFull", u.isPortfolioFull(),
                "busdevFull",    u.isBusdevFull(),
                "pnlAccess",     u.isPnlAccess()
            )
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtUtil.extractUsername(token);
        return userService.getByUsername(username)
            .map(u -> ResponseEntity.ok(Map.of(
                "id",            u.getId(),
                "username",      u.getUsername(),
                "fullName",      u.getFullName(),
                "role",          u.getRole(),
                "portfolioFull", u.isPortfolioFull(),
                "busdevFull",    u.isBusdevFull(),
                "pnlAccess",     u.isPnlAccess()
            )))
            .orElse(ResponseEntity.notFound().build());
    }
}
