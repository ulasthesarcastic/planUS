package com.projectmanager.controller;

import com.projectmanager.model.OrganizationUnit;
import com.projectmanager.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organization")
public class OrganizationController {
    private final OrganizationService service;

    public OrganizationController(OrganizationService service) { this.service = service; }

    @GetMapping
    public List<OrganizationUnit> getAll() { return service.getAll(); }

    @GetMapping("/roots")
    public List<OrganizationUnit> getRoots() { return service.getRoots(); }

    @GetMapping("/{id}/children")
    public List<OrganizationUnit> getChildren(@PathVariable String id) { return service.getChildren(id); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody OrganizationUnit unit) {
        try { return ResponseEntity.ok(service.create(unit)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody OrganizationUnit unit) {
        try {
            return service.update(id, unit)
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
