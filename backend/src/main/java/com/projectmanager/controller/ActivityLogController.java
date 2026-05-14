package com.projectmanager.controller;

import com.projectmanager.model.ActivityLog;
import com.projectmanager.model.User;
import com.projectmanager.repository.ActivityLogRepository;
import com.projectmanager.service.AutoShiftService;
import com.projectmanager.service.PermissionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/activity-log")
public class ActivityLogController {

    private final ActivityLogRepository logRepo;
    private final AutoShiftService      autoShiftService;
    private final PermissionService     permissionService;

    public ActivityLogController(ActivityLogRepository logRepo,
                                 AutoShiftService autoShiftService,
                                 PermissionService permissionService) {
        this.logRepo          = logRepo;
        this.autoShiftService = autoShiftService;
        this.permissionService = permissionService;
    }

    /** Mevcut kullanıcının yetkisine göre filtrelenmiş logları sayfalı döner */
    @GetMapping
    public Page<ActivityLog> list(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false)     String entityType) {

        PageRequest pr = PageRequest.of(page, size);

        // ADMIN → tüm loglar
        if (permissionService.isAdmin()) {
            if (entityType != null && !entityType.isBlank())
                return logRepo.findByEntityTypeOrderByCreatedAtDesc(entityType, pr);
            return logRepo.findAllByOrderByCreatedAtDesc(pr);
        }

        // Kullanıcı rolüne göre izin verilen entityType listesi
        List<String> allowed = resolveAllowedEntityTypes();

        if (entityType != null && !entityType.isBlank()) {
            // İstenen entityType izinli mi?
            if (!allowed.contains(entityType)) {
                return Page.empty(pr);
            }
            return logRepo.findByEntityTypeOrderByCreatedAtDesc(entityType, pr);
        }

        if (allowed.isEmpty()) return Page.empty(pr);
        return logRepo.findByEntityTypeInOrderByCreatedAtDesc(allowed, pr);
    }

    /** Geçmiş kalan potansiyelleri kaydırır ve sonucu döner */
    @PostMapping("/shift-overdue")
    public ResponseEntity<AutoShiftService.ShiftResult> shiftOverdue() {
        AutoShiftService.ShiftResult result = autoShiftService.shiftOverdue();
        return ResponseEntity.ok(result);
    }

    // ── Yardımcı ────────────────────────────────────────────────────────────

    /**
     * Mevcut kullanıcının modül yetkilerine göre görebileceği entityType'ları döner.
     *
     * portfolioFull → PROJE, ODEME_KALEMI, KAYNAK_PLANLAMA, MALIYET, SATINALMA, PERSONEL, KIDEM
     * busdevFull    → POTANSIYEL_PROJE, POTANSIYEL_SIPARIS
     * pnlAccess     → MALIYET, SATINALMA, PROJE
     */
    private List<String> resolveAllowedEntityTypes() {
        User user = permissionService.currentUser();
        if (user == null) return List.of();

        List<String> types = new ArrayList<>();

        if (user.isPortfolioFull()) {
            types.addAll(List.of("PROJE", "ODEME_KALEMI", "KAYNAK_PLANLAMA", "MALIYET", "SATINALMA", "PERSONEL", "KIDEM"));
        }

        if (user.isBusdevFull()) {
            types.addAll(List.of("POTANSIYEL_PROJE", "POTANSIYEL_SIPARIS"));
        }

        if (user.isPnlAccess()) {
            // pnlAccess ekstra tipler ekler (zaten eklenmemişse)
            for (String t : List.of("MALIYET", "SATINALMA", "PROJE")) {
                if (!types.contains(t)) types.add(t);
            }
        }

        return types;
    }
}
