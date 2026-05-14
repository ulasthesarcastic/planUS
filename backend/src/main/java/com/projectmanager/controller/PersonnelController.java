package com.projectmanager.controller;

import com.projectmanager.model.Personnel;
import com.projectmanager.model.PersonnelSeniorityHistory;
import com.projectmanager.service.PersonnelService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final PersonnelService personnelService;

    public PersonnelController(PersonnelService personnelService) {
        this.personnelService = personnelService;
    }

    @GetMapping
    public List<Personnel> getAll() {
        return personnelService.getAll();
    }

    // Arama + sayfalı endpoint
    // GET /api/personnel/search?q=ali&page=0&size=20&unitId=xxx
    @GetMapping("/search")
    public Page<Personnel> search(
            @RequestParam(defaultValue = "")   String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String unitId) {
        return personnelService.search(q, unitId, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return personnelService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Personnel personnel) {
        try {
            return ResponseEntity.ok(personnelService.create(personnel));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Personnel personnel) {
        try {
            return personnelService.update(id, personnel)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        boolean deleted = personnelService.delete(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/seniority-history")
    public List<PersonnelSeniorityHistory> getAllSeniorityHistory() {
        return personnelService.getAllSeniorityHistory();
    }

    @GetMapping("/{id}/seniority-history")
    public List<PersonnelSeniorityHistory> getSeniorityHistory(@PathVariable String id) {
        return personnelService.getSeniorityHistory(id);
    }

    @PutMapping("/{id}/seniority-history")
    public ResponseEntity<?> saveSeniorityHistory(
            @PathVariable String id,
            @RequestBody List<PersonnelSeniorityHistory> entries) {
        try {
            return ResponseEntity.ok(personnelService.saveSeniorityHistory(id, entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/future-plans/count")
    public ResponseEntity<?> countFuturePlans(
            @PathVariable String id,
            @RequestParam int year,
            @RequestParam int month) {
        long count = personnelService.countFuturePlans(id, year, month);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/{id}/future-plans/details")
    public ResponseEntity<?> futurePlanDetails(
            @PathVariable String id,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(personnelService.getFuturePlanDetails(id, year, month));
    }

    @DeleteMapping("/{id}/future-plans")
    public ResponseEntity<?> deleteFuturePlans(
            @PathVariable String id,
            @RequestParam int year,
            @RequestParam int month) {
        int deleted = personnelService.deleteFuturePlans(id, year, month);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }
}
