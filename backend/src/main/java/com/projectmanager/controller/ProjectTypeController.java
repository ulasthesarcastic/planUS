package com.projectmanager.controller;

import com.projectmanager.model.ProjectType;
import com.projectmanager.service.ProjectTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-types")
public class ProjectTypeController {

    private final ProjectTypeService service;

    public ProjectTypeController(ProjectTypeService service) { this.service = service; }

    @GetMapping
    public List<ProjectType> getAll() { return service.getAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProjectType type) {
        try { return ResponseEntity.ok(service.create(type)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody ProjectType type) {
        try {
            return service.update(id, type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            return service.delete(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
        } catch (IllegalStateException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}
