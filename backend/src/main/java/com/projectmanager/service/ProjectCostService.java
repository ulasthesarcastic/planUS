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

    public ProjectCostService(ProjectCostRepository repo) { this.repo = repo; }

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
        return repo.saveAll(costs);
    }
}
