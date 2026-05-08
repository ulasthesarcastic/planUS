package com.projectmanager.controller;

import com.projectmanager.model.User;
import com.projectmanager.model.UserProjectPermission;
import com.projectmanager.service.PermissionService;
import com.projectmanager.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final PermissionService permissionService;

    public UserController(UserService userService, PermissionService permissionService) {
        this.userService = userService;
        this.permissionService = permissionService;
    }

    @GetMapping
    public List<User> getAll() { return userService.getAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.create(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody User user) {
        try {
            return userService.update(id, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            return userService.delete(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Modül yetkileri ───────────────────────────────────────────────────────

    /** Kullanıcının modül (portfolioFull, busdevFull, pnlAccess) + proje yetkilerini döner */
    @GetMapping("/{id}/permissions")
    public ResponseEntity<?> getPermissions(@PathVariable String id) {
        return userService.getById(id).map(user -> {
            List<UserProjectPermission> projectPerms = permissionService.getProjectPermissions(id);
            return ResponseEntity.ok(Map.of(
                "portfolioFull", user.isPortfolioFull(),
                "busdevFull",    user.isBusdevFull(),
                "pnlAccess",     user.isPnlAccess(),
                "projectPermissions", projectPerms
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Kullanıcının tüm yetkilerini günceller.
     * Body: { portfolioFull, busdevFull, pnlAccess,
     *         projectPermissions: [{projectId, canRead, canWrite, canEdit, canDelete}] }
     */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<?> updatePermissions(@PathVariable String id,
                                               @RequestBody Map<String, Object> body) {
        try {
            return userService.updatePermissions(id, body, permissionService)
                .map(u -> ResponseEntity.ok().build())
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
