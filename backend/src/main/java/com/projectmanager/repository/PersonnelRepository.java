package com.projectmanager.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.projectmanager.model.Personnel;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PersonnelRepository extends JsonFileRepository<Personnel> {

    @Override
    protected String getFileName() { return "personnel.json"; }

    @Override
    protected TypeReference<List<Personnel>> getTypeReference() {
        return new TypeReference<>() {};
    }

    public List<Personnel> findAll() {
        return readAll();
    }

    public Optional<Personnel> findById(String id) {
        return readAll().stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public boolean existsById(String id) {
        return readAll().stream().anyMatch(p -> p.getId().equals(id));
    }

    public Personnel save(Personnel personnel) {
        List<Personnel> all = readAll();
        all.removeIf(p -> p.getId().equals(personnel.getId()));
        all.add(personnel);
        writeAll(all);
        return personnel;
    }

    public boolean deleteById(String id) {
        List<Personnel> all = readAll();
        boolean removed = all.removeIf(p -> p.getId().equals(id));
        if (removed) writeAll(all);
        return removed;
    }

    public boolean existsBySeniorityId(String seniorityId) {
        return readAll().stream().anyMatch(p -> seniorityId.equals(p.getSeniorityId()));
    }
}
