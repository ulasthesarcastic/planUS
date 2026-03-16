package com.projectmanager.controller;

import com.projectmanager.model.PotentialSale;
import com.projectmanager.service.PotentialSaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/potential-sales")
public class PotentialSaleController {
    private final PotentialSaleService service;

    public PotentialSaleController(PotentialSaleService service) { this.service = service; }

    @GetMapping
    public List<PotentialSale> getAll() { return service.getAll(); }

    @GetMapping("/project/{projectId}")
    public List<PotentialSale> getByProject(@PathVariable String projectId) {
        return service.getByProject(projectId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PotentialSale sale) {
        try { return ResponseEntity.ok(service.create(sale)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody PotentialSale sale) {
        try {
            return service.update(id, sale)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return service.delete(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}
