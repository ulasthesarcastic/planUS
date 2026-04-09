package com.projectmanager.controller;

import com.projectmanager.model.WorkflowStep;
import com.projectmanager.service.WorkflowStepService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow-steps")
public class WorkflowStepController {

    private final WorkflowStepService service;

    public WorkflowStepController(WorkflowStepService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkflowStep> getAll(@RequestParam(required = false) String categoryId) {
        if (categoryId != null && !categoryId.isBlank()) {
            return service.getByCategoryId(categoryId);
        }
        return List.of();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody WorkflowStep step) {
        try {
            return ResponseEntity.ok(service.create(step));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody WorkflowStep step) {
        try {
            return service.update(id, step)
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
}
