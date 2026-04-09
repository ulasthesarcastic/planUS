package com.projectmanager.service;

import com.projectmanager.model.ProjectCategory;
import com.projectmanager.repository.ProjectCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectCategoryService {

    private final ProjectCategoryRepository repo;

    public ProjectCategoryService(ProjectCategoryRepository repo) {
        this.repo = repo;
    }

    public List<ProjectCategory> getAll() {
        return repo.findAllByOrderByStepOrderAsc();
    }

    @Transactional
    public ProjectCategory create(ProjectCategory cat) {
        if (cat.getName() == null || cat.getName().isBlank())
            throw new IllegalArgumentException("Kategori adı zorunludur.");
        return repo.save(cat);
    }

    @Transactional
    public Optional<ProjectCategory> update(String id, ProjectCategory cat) {
        return repo.findById(id).map(existing -> {
            existing.setName(cat.getName());
            existing.setColor(cat.getColor());
            existing.setStepOrder(cat.getStepOrder());
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
