package com.projectmanager.service;

import com.projectmanager.model.User;
import com.projectmanager.model.UserProjectPermission;
import com.projectmanager.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogService = activityLogService;
    }

    public List<User> getAll() { return userRepository.findAll(); }
    public Optional<User> getById(String id) { return userRepository.findById(id); }
    public Optional<User> getByUsername(String username) { return userRepository.findByUsername(username); }

    @Transactional
    public User create(User user) {
        if (userRepository.existsByUsername(user.getUsername()))
            throw new IllegalArgumentException("Bu kullanıcı adı zaten alınmış.");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        try {
            activityLogService.log("KULLANICI", saved.getId(), saved.getUsername(), "CREATE",
                    "Rol: " + saved.getRole());
        } catch (Exception ignored) {}
        return saved;
    }

    @Transactional
    public Optional<User> update(String id, User updated) {
        return userRepository.findById(id).map(existing -> {
            existing.setFullName(updated.getFullName());
            existing.setRole(updated.getRole());
            existing.setActive(updated.isActive());
            if (updated.getPassword() != null && !updated.getPassword().isBlank())
                existing.setPassword(passwordEncoder.encode(updated.getPassword()));
            User saved = userRepository.save(existing);
            try {
                activityLogService.log("KULLANICI", saved.getId(), saved.getUsername(), "UPDATE",
                        "Ad: " + saved.getFullName() + ", Rol: " + saved.getRole()
                        + ", Aktif: " + saved.isActive());
            } catch (Exception ignored) {}
            return saved;
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!userRepository.existsById(id)) return false;
        String username = userRepository.findById(id).map(User::getUsername).orElse(id);
        userRepository.deleteById(id);
        try {
            activityLogService.log("KULLANICI", id, username, "DELETE", null);
        } catch (Exception ignored) {}
        return true;
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /** Modül + proje yetkilerini günceller */
    @Transactional
    @SuppressWarnings("unchecked")
    public Optional<User> updatePermissions(String id, Map<String, Object> body,
                                            PermissionService permissionService) {
        return userRepository.findById(id).map(user -> {
            // Modül yetkileri
            if (body.containsKey("portfolioFull"))
                user.setPortfolioFull(Boolean.TRUE.equals(body.get("portfolioFull")));
            if (body.containsKey("busdevFull"))
                user.setBusdevFull(Boolean.TRUE.equals(body.get("busdevFull")));
            if (body.containsKey("pnlAccess"))
                user.setPnlAccess(Boolean.TRUE.equals(body.get("pnlAccess")));
            userRepository.save(user);

            // Proje bazlı yetkiler
            if (body.containsKey("projectPermissions")) {
                List<Map<String, Object>> rawList =
                    (List<Map<String, Object>>) body.get("projectPermissions");
                List<UserProjectPermission> perms = rawList.stream().map(m -> {
                    UserProjectPermission p = new UserProjectPermission();
                    p.setUserId(id);
                    p.setProjectId((String) m.get("projectId"));
                    p.setCanRead(Boolean.TRUE.equals(m.get("canRead")));
                    p.setCanWrite(Boolean.TRUE.equals(m.get("canWrite")));
                    p.setCanEdit(Boolean.TRUE.equals(m.get("canEdit")));
                    p.setCanDelete(Boolean.TRUE.equals(m.get("canDelete")));
                    return p;
                }).toList();
                permissionService.saveProjectPermissions(id, perms);
            }
            return user;
        });
    }
}
