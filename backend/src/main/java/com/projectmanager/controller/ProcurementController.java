package com.projectmanager.controller;

import com.projectmanager.model.Procurement;
import com.projectmanager.repository.ProcurementRepository;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.service.ActivityLogService;
import com.projectmanager.service.PermissionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class ProcurementController {

    private final ProcurementRepository repo;
    private final ProjectRepository projectRepository;
    private final PermissionService permissionService;
    private final ActivityLogService activityLogService;

    public ProcurementController(ProcurementRepository repo,
                                 ProjectRepository projectRepository,
                                 PermissionService permissionService,
                                 ActivityLogService activityLogService) {
        this.repo = repo;
        this.projectRepository = projectRepository;
        this.permissionService = permissionService;
        this.activityLogService = activityLogService;
    }

    /** Tüm projeler için satın alma kayıtları (P&L sayfası için) */
    @GetMapping("/api/procurements")
    public List<Procurement> getAll() {
        return repo.findAll();
    }

    /** Bir projeye ait satın alma kayıtları — okuma herhangi bir kimlik doğrulanmış kullanıcıya açık */
    @GetMapping("/api/projects/{projectId}/procurements")
    public List<Procurement> getByProject(@PathVariable String projectId) {
        return repo.findByProjectIdOrderByIdAsc(projectId);
    }

    /** Projenin satın alma kayıtlarını toplu kaydet — yazma yetkisi gerektirir */
    @PutMapping("/api/projects/{projectId}/procurements")
    @Transactional
    public ResponseEntity<List<Procurement>> saveAll(
            @PathVariable String projectId,
            @RequestBody List<Procurement> items) {
        String status = projectRepository.findById(projectId)
                .map(p -> p.getProjectStatus())
                .orElse(null);
        if (!permissionService.canWrite(projectId, status))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projede satın alma düzenleme yetkiniz yok.");
        repo.deleteByProjectId(projectId);
        for (Procurement p : items) {
            p.setId(null);
            p.setProjectId(projectId);
        }
        List<Procurement> saved = repo.saveAll(items);
        try {
            String projectName = projectRepository.findById(projectId)
                    .map(p -> p.getName()).orElse(projectId);
            activityLogService.log("SATINALMA", projectId, projectName, "UPDATE",
                    saved.size() + " satın alma kalemi kaydedildi");
        } catch (Exception ignored) {}
        return ResponseEntity.ok(saved);
    }
}
