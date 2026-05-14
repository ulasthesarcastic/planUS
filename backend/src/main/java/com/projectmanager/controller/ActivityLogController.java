package com.projectmanager.controller;

import com.projectmanager.model.ActivityLog;
import com.projectmanager.repository.ActivityLogRepository;
import com.projectmanager.service.AutoShiftService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity-log")
public class ActivityLogController {

    private final ActivityLogRepository logRepo;
    private final AutoShiftService      autoShiftService;

    public ActivityLogController(ActivityLogRepository logRepo, AutoShiftService autoShiftService) {
        this.logRepo          = logRepo;
        this.autoShiftService = autoShiftService;
    }

    /** Tüm logları sayfalı döner (varsayılan: son 100 kayıt) */
    @GetMapping
    public Page<ActivityLog> list(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false)     String entityType) {

        PageRequest pr = PageRequest.of(page, size);
        if (entityType != null && !entityType.isBlank())
            return logRepo.findByEntityTypeOrderByCreatedAtDesc(entityType, pr);
        return logRepo.findAllByOrderByCreatedAtDesc(pr);
    }

    /** Geçmiş kalan potansiyelleri kaydırır ve sonucu döner */
    @PostMapping("/shift-overdue")
    public ResponseEntity<AutoShiftService.ShiftResult> shiftOverdue() {
        AutoShiftService.ShiftResult result = autoShiftService.shiftOverdue();
        return ResponseEntity.ok(result);
    }
}
