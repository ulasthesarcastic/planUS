package com.projectmanager.service;

import com.projectmanager.model.User;
import com.projectmanager.model.UserProjectPermission;
import com.projectmanager.repository.UserProjectPermissionRepository;
import com.projectmanager.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private final UserRepository userRepository;
    private final UserProjectPermissionRepository permRepo;

    public PermissionService(UserRepository userRepository,
                             UserProjectPermissionRepository permRepo) {
        this.userRepository = userRepository;
        this.permRepo = permRepo;
    }

    // ── Yardımcı: mevcut kullanıcı ──────────────────────────────────────────

    private Authentication authentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public boolean isAdmin() {
        Authentication auth = authentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /** Mevcut oturumu açık kullanıcıyı döner. ADMIN dışında null dönmez (token geçerli ise). */
    public User currentUser() {
        Authentication auth = authentication();
        if (auth == null) return null;
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    // ── Proje yetkisi haritası ──────────────────────────────────────────────

    /**
     * Mevcut kullanıcının erişebildiği projelerin yetki haritasını döner.
     * null → tüm projelere tam erişim (ADMIN veya portfolioFull)
     */
    public Map<String, UserProjectPermission> projectPermissionMap() {
        if (isAdmin()) return null;
        User user = currentUser();
        if (user == null) return Map.of();
        if (user.isPortfolioFull()) return null;

        return permRepo.findByUserId(user.getId()).stream()
                .collect(Collectors.toMap(UserProjectPermission::getProjectId, p -> p));
    }

    // ── Proje kontrolleri ───────────────────────────────────────────────────

    /** Potansiyel projeler herkese açık */
    public static boolean isPotential(String projectStatus) {
        return "POTANSIYEL".equals(projectStatus);
    }

    public boolean canRead(String projectId, String projectStatus) {
        if (isAdmin()) return true;
        if (isPotential(projectStatus)) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isPortfolioFull()) return true;
        return permRepo.findByUserIdAndProjectId(user.getId(), projectId)
                .map(UserProjectPermission::isCanRead).orElse(false);
    }

    public boolean canWrite(String projectId, String projectStatus) {
        if (isAdmin()) return true;
        if (isPotential(projectStatus)) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isPortfolioFull()) return true;
        return permRepo.findByUserIdAndProjectId(user.getId(), projectId)
                .map(UserProjectPermission::isCanWrite).orElse(false);
    }

    public boolean canEdit(String projectId, String projectStatus) {
        if (isAdmin()) return true;
        if (isPotential(projectStatus)) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isPortfolioFull()) return true;
        return permRepo.findByUserIdAndProjectId(user.getId(), projectId)
                .map(UserProjectPermission::isCanEdit).orElse(false);
    }

    public boolean canDelete(String projectId, String projectStatus) {
        if (isAdmin()) return true;
        if (isPotential(projectStatus)) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isPortfolioFull()) return true;
        return permRepo.findByUserIdAndProjectId(user.getId(), projectId)
                .map(UserProjectPermission::isCanDelete).orElse(false);
    }

    /** Yeni proje oluşturma: ADMIN veya portfolioFull */
    public boolean canCreateProject() {
        if (isAdmin()) return true;
        User user = currentUser();
        return user != null && user.isPortfolioFull();
    }

    /**
     * Potansiyel projeyi gerçek projeye dönüştürmek sadece ADMIN yetkisi gerektirir.
     * Mevcut status POTANSIYEL, yeni status farklıysa kontrol edilir.
     */
    public boolean canConvertFromPotential() {
        return isAdmin();
    }

    // ── P&L ve İş Geliştirme ────────────────────────────────────────────────

    public boolean hasPnlAccess() {
        if (isAdmin()) return true;
        User user = currentUser();
        return user != null && user.isPnlAccess();
    }

    public boolean hasBusdevFull() {
        if (isAdmin()) return true;
        User user = currentUser();
        return user != null && user.isBusdevFull();
    }

    // ── Potansiyel satış/sipariş yetkisi ─────────────────────────────────────

    /**
     * Satış/siparişe erişim:
     * - ADMIN veya busdevFull → hepsine
     * - portfolioFull → ilgili projeye erişebildikleri için
     * - projectId null ise: sadece busdevFull veya ADMIN
     * - aksi halde: o projeye can_read yetkisi
     */
    public boolean canReadSale(String saleProjectId) {
        if (isAdmin()) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isBusdevFull() || user.isPortfolioFull()) return true;
        if (saleProjectId == null || saleProjectId.isBlank()) return false;
        return permRepo.findByUserIdAndProjectId(user.getId(), saleProjectId)
                .map(UserProjectPermission::isCanRead).orElse(false);
    }

    public boolean canWriteSale(String saleProjectId) {
        if (isAdmin()) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isBusdevFull() || user.isPortfolioFull()) return true;
        if (saleProjectId == null || saleProjectId.isBlank()) return false;
        return permRepo.findByUserIdAndProjectId(user.getId(), saleProjectId)
                .map(UserProjectPermission::isCanWrite).orElse(false);
    }

    public boolean canEditSale(String saleProjectId) {
        if (isAdmin()) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isBusdevFull() || user.isPortfolioFull()) return true;
        if (saleProjectId == null || saleProjectId.isBlank()) return false;
        return permRepo.findByUserIdAndProjectId(user.getId(), saleProjectId)
                .map(UserProjectPermission::isCanEdit).orElse(false);
    }

    public boolean canDeleteSale(String saleProjectId) {
        if (isAdmin()) return true;
        User user = currentUser();
        if (user == null) return false;
        if (user.isBusdevFull() || user.isPortfolioFull()) return true;
        if (saleProjectId == null || saleProjectId.isBlank()) return false;
        return permRepo.findByUserIdAndProjectId(user.getId(), saleProjectId)
                .map(UserProjectPermission::isCanDelete).orElse(false);
    }

    // ── Yetki yönetimi (UserController için) ───────────────────────────────

    public List<UserProjectPermission> getProjectPermissions(String userId) {
        return permRepo.findByUserId(userId);
    }

    public void saveProjectPermissions(String userId, List<UserProjectPermission> permissions) {
        permRepo.deleteByUserId(userId);
        permissions.forEach(p -> p.setUserId(userId));
        permRepo.saveAll(permissions);
    }
}
