package com.projectmanager.controller;

import com.projectmanager.model.ProjectCost;
import com.projectmanager.service.ProjectCostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/costs")
public class ProjectCostController {

    private final ProjectCostService service;

    public ProjectCostController(ProjectCostService service) { this.service = service; }

    @GetMapping
    public List<ProjectCost> getByProject(@PathVariable String projectId) {
        return service.getByProject(projectId);
    }

    @PutMapping
    public ResponseEntity<List<ProjectCost>> saveAll(
            @PathVariable String projectId,
            @RequestBody List<ProjectCost> costs) {
        return ResponseEntity.ok(service.saveAll(projectId, costs));
    }
}
