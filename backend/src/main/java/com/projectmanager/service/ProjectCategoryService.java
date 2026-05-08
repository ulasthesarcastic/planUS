package com.projectmanager.service;

import com.projectmanager.model.ProjectCategory;
import com.projectmanager.repository.ProjectCategoryRepository;
import com.projectmanager.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectCategoryService {

    private final ProjectCategoryRepository repo;
    private final ProjectRepository projectRepository;

    public ProjectCategoryService(ProjectCategoryRepository repo, ProjectRepository projectRepository) {
        this.repo = repo;
        this.projectRepository = projectRepository;
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
            existing.setIcon(cat.getIcon());
            existing.setSectionLabel(cat.getSectionLabel());
            existing.setMenuLabel(cat.getMenuLabel());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;

        // Projesi olan kategori silinmemeli — anlamlı hata ver
        long projectCount = projectRepository.countByCategoryId(id);
        if (projectCount > 0) {
            throw new IllegalArgumentException(
                "Bu kategoride " + projectCount + " proje bulunuyor. " +
                "Silmeden önce projeleri farklı bir kategoriye taşıyın.");
        }

        // workflow_steps ON DELETE CASCADE ile otomatik silinir (V11 migration)
        repo.deleteById(id);
        return true;
    }
}
