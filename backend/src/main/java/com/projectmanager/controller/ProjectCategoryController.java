package com.projectmanager.controller;

import com.projectmanager.model.ProjectCategory;
import com.projectmanager.model.WorkflowStep;
import com.projectmanager.service.ProjectCategoryService;
import com.projectmanager.service.WorkflowStepService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-categories")
public class ProjectCategoryController {

    private final ProjectCategoryService service;
    private final WorkflowStepService workflowStepService;

    public ProjectCategoryController(ProjectCategoryService service, WorkflowStepService workflowStepService) {
        this.service = service;
        this.workflowStepService = workflowStepService;
    }

    @GetMapping
    public List<ProjectCategory> getAll() {
        return service.getAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProjectCategory cat) {
        try {
            return ResponseEntity.ok(service.create(cat));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ProjectCategory cat) {
        try {
            return service.update(id, cat)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return service.delete(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/{categoryId}/workflow")
    public List<WorkflowStep> getWorkflow(@PathVariable String categoryId) {
        return workflowStepService.getByCategoryId(categoryId);
    }

    @PutMapping("/{categoryId}/workflow")
    public ResponseEntity<?> saveWorkflow(@PathVariable String categoryId, @RequestBody List<WorkflowStep> steps) {
        try {
            return ResponseEntity.ok(workflowStepService.saveAll(categoryId, steps));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
