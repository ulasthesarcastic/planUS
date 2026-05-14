package com.projectmanager.service;

import com.projectmanager.model.ActivityLog;
import com.projectmanager.repository.ActivityLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repo;

    public ActivityLogService(ActivityLogRepository repo) {
        this.repo = repo;
    }

    /**
     * Mevcut işlemi activity_log tablosuna yazar.
     * actor SecurityContextHolder'dan otomatik alınır; oturum yoksa "system" fallback kullanılır.
     */
    public void log(String entityType, String entityId, String entityName,
                    String action, String detail) {
        try {
            String actor = resolveActor();
            repo.save(new ActivityLog(entityType, entityId, entityName, action, actor, detail));
        } catch (Exception ignored) {
            // Loglama ana işlemi asla bozmamalı
        }
    }

    private String resolveActor() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "system";
    }
}
