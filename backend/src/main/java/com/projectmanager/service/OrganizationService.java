package com.projectmanager.service;

import com.projectmanager.model.OrganizationUnit;
import com.projectmanager.repository.OrganizationUnitRepository;
import com.projectmanager.repository.PersonnelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class OrganizationService {
    private final OrganizationUnitRepository repo;
    private final PersonnelRepository personnelRepository;

    public OrganizationService(OrganizationUnitRepository repo, PersonnelRepository personnelRepository) {
        this.repo = repo;
        this.personnelRepository = personnelRepository;
    }

    public List<OrganizationUnit> getAll() { return repo.findAll(); }
    public List<OrganizationUnit> getRoots() { return repo.findByParentIdIsNull(); }
    public List<OrganizationUnit> getChildren(String parentId) { return repo.findByParentId(parentId); }
    public Optional<OrganizationUnit> getById(String id) { return repo.findById(id); }

    @Transactional
    public OrganizationUnit create(OrganizationUnit unit) {
        validate(unit);
        return repo.save(unit);
    }

    @Transactional
    public Optional<OrganizationUnit> update(String id, OrganizationUnit updated) {
        validate(updated);
        return repo.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setParentId(updated.getParentId());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        if (repo.existsByParentId(id))
            throw new IllegalStateException("Bu birimin alt birimleri bulunmaktadır.");
        repo.deleteById(id);
        return true;
    }

    private void validate(OrganizationUnit u) {
        if (u.getName() == null || u.getName().isBlank())
            throw new IllegalArgumentException("Birim adı zorunludur.");
        if (u.getParentId() != null && !u.getParentId().isBlank())
            repo.findById(u.getParentId())
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz üst birim."));
    }
}
