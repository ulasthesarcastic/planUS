package com.projectmanager.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.projectmanager.model.Project;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProjectRepository extends JsonFileRepository<Project> {

    @Override
    protected String getFileName() { return "projects.json"; }

    @Override
    protected TypeReference<List<Project>> getTypeReference() {
        return new TypeReference<>() {};
    }

    public List<Project> findAll() { return readAll(); }

    public Optional<Project> findById(String id) {
        return readAll().stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public Project save(Project project) {
        List<Project> all = readAll();
        all.removeIf(p -> p.getId().equals(project.getId()));
        all.add(project);
        writeAll(all);
        return project;
    }

    public boolean deleteById(String id) {
        List<Project> all = readAll();
        boolean removed = all.removeIf(p -> p.getId().equals(id));
        if (removed) writeAll(all);
        return removed;
    }

    public boolean existsByPersonnelId(String personnelId) {
        return readAll().stream().anyMatch(p ->
            personnelId.equals(p.getProjectManagerId()) || personnelId.equals(p.getTechLeadId()));
    }
}
