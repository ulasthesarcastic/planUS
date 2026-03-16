package com.projectmanager.controller;

import com.projectmanager.model.Milestone;
import com.projectmanager.model.ResourceEntry;
import com.projectmanager.model.PaymentItem;
import com.projectmanager.model.Project;
import com.projectmanager.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<Project> getAll() { return projectService.getAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return projectService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.create(project));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Project project) {
        try {
            return projectService.update(id, project)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return projectService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    // Partial update endpoints — sadece ilgili listeyi günceller
    @PutMapping("/{id}/personnel")
    public ResponseEntity<?> updatePersonnel(@PathVariable String id, @RequestBody List<String> personnelIds) {
        return projectService.updatePersonnel(id, personnelIds)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/payment-plan")
    public ResponseEntity<?> updatePaymentPlan(@PathVariable String id, @RequestBody List<PaymentItem> paymentPlan) {
        return projectService.updatePaymentPlan(id, paymentPlan)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/milestones")
    public ResponseEntity<?> updateMilestones(@PathVariable String id, @RequestBody List<Milestone> milestones) {
        return projectService.updateMilestones(id, milestones)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}/budget")
    public ResponseEntity<?> updateBudget(@PathVariable String id, @RequestBody Map<String, Double> body) {
        double remaining = body.getOrDefault("remainingBudget", 0.0);
        double potential = body.getOrDefault("potentialSales", 0.0);
        return projectService.updateBudget(id, remaining, potential)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/products")
    public ResponseEntity<?> updateProducts(@PathVariable String id, @RequestBody List<String> productIds) {
        return projectService.updateProducts(id, productIds)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/resource-plan")
    public ResponseEntity<?> updateResourcePlan(@PathVariable String id, @RequestBody List<ResourceEntry> resourcePlan) {
        return projectService.updateResourcePlan(id, resourcePlan)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
