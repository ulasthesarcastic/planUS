package com.projectmanager.service;

import com.projectmanager.model.CostType;
import com.projectmanager.repository.CostTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CostTypeService {

    private final CostTypeRepository repo;

    public CostTypeService(CostTypeRepository repo) { this.repo = repo; }

    public List<CostType> getAll() {
        return repo.findAllByOrderByNameAsc();
    }

    public Optional<CostType> getById(String id) {
        return repo.findById(id);
    }

    @Transactional
    public CostType create(CostType ct) {
        if (ct.getName() == null || ct.getName().isBlank())
            throw new IllegalArgumentException("Maliyet tipi adı boş olamaz.");
        ct.setId(UUID.randomUUID().toString());
        return repo.save(ct);
    }

    @Transactional
    public Optional<CostType> update(String id, CostType updated) {
        if (updated.getName() == null || updated.getName().isBlank())
            throw new IllegalArgumentException("Maliyet tipi adı boş olamaz.");
        return repo.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setDisplayOrder(updated.getDisplayOrder());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }
}
