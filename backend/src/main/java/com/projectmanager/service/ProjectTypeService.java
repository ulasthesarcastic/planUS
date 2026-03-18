package com.projectmanager.service;

import com.projectmanager.model.ProjectType;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.ProjectTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectTypeService {

    private final ProjectTypeRepository repo;
    private final ProjectRepository projectRepository;

    public ProjectTypeService(ProjectTypeRepository repo, ProjectRepository projectRepository) {
        this.repo = repo;
        this.projectRepository = projectRepository;
    }

    public List<ProjectType> getAll() { return repo.findAll(); }
    public Optional<ProjectType> getById(String id) { return repo.findById(id); }

    @Transactional
    public ProjectType create(ProjectType type) {
        if (type.getName() == null || type.getName().isBlank())
            throw new IllegalArgumentException("Proje tipi adı zorunludur.");
        if (repo.existsByName(type.getName().trim()))
            throw new IllegalArgumentException("Bu isimde bir proje tipi zaten mevcut.");
        type.setName(type.getName().trim());
        return repo.save(type);
    }

    @Transactional
    public Optional<ProjectType> update(String id, ProjectType updated) {
        if (updated.getName() == null || updated.getName().isBlank())
            throw new IllegalArgumentException("Proje tipi adı zorunludur.");
        return repo.findById(id).map(existing -> {
            existing.setName(updated.getName().trim());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        if (projectRepository.existsByProjectType(id))
            throw new IllegalStateException("Bu proje tipine bağlı projeler bulunmaktadır.");
        repo.deleteById(id);
        return true;
    }
}
