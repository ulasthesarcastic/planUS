package com.projectmanager.controller;

import com.projectmanager.model.ProjectType;
import com.projectmanager.repository.ProjectTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-types")
public class ProjectTypeController {
    private final ProjectTypeRepository repo;

    public ProjectTypeController(ProjectTypeRepository repo) { this.repo = repo; }

    @GetMapping
    public List<ProjectType> getAll() { return repo.findAllByOrderBySortOrderAsc(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProjectType pt) {
        if (pt.getName() == null || pt.getName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "İsim zorunludur."));
        return ResponseEntity.ok(repo.save(pt));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ProjectType pt) {
        return repo.findById(id).map(existing -> {
            existing.setName(pt.getName());
            existing.setColor(pt.getColor());
            existing.setSortOrder(pt.getSortOrder());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
