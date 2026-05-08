package com.projectmanager.controller;

import com.projectmanager.model.GeneralExpense;
import com.projectmanager.service.GeneralExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/general-expenses")
public class GeneralExpenseController {

    private final GeneralExpenseService service;

    public GeneralExpenseController(GeneralExpenseService service) {
        this.service = service;
    }

    @GetMapping
    public List<GeneralExpense> getAll() {
        return service.getAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody GeneralExpense expense) {
        try {
            return ResponseEntity.ok(service.create(expense));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody GeneralExpense expense) {
        try {
            return service.update(id, expense)
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
