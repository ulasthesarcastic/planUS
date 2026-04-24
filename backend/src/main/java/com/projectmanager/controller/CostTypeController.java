package com.projectmanager.controller;

import com.projectmanager.model.CostType;
import com.projectmanager.service.CostTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cost-types")
public class CostTypeController {

    private final CostTypeService service;

    public CostTypeController(CostTypeService service) { this.service = service; }

    @GetMapping
    public List<CostType> getAll() { return service.getAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CostType ct) {
        try {
            return ResponseEntity.ok(service.create(ct));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody CostType ct) {
        try {
            return service.update(id, ct)
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
