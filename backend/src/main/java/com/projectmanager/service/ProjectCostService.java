package com.projectmanager.service;

import com.projectmanager.model.ProjectCost;
import com.projectmanager.repository.ProjectCostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectCostService {

    private final ProjectCostRepository repo;
    private final ActivityLogService activityLogService;

    public ProjectCostService(ProjectCostRepository repo, ActivityLogService activityLogService) {
        this.repo = repo;
        this.activityLogService = activityLogService;
    }

    public List<ProjectCost> getAll() {
        return repo.findAll();
    }

    public List<ProjectCost> getByProject(String projectId) {
        return repo.findByProjectId(projectId);
    }

    @Transactional
    public List<ProjectCost> saveAll(String projectId, List<ProjectCost> costs) {
        repo.deleteByProjectId(projectId);
        costs.forEach(c -> {
            c.setId(UUID.randomUUID().toString());
            c.setProjectId(projectId);
        });
        List<ProjectCost> saved = repo.saveAll(costs);
        try {
            activityLogService.log("MALIYET", projectId, projectId, "UPDATE",
                    saved.size() + " maliyet kalemi kaydedildi");
        } catch (Exception ignored) {}
        return saved;
    }
}
