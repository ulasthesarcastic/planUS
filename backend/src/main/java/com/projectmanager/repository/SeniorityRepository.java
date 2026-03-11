package com.projectmanager.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.projectmanager.model.Seniority;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class SeniorityRepository extends JsonFileRepository<Seniority> {

    @Override
    protected String getFileName() { return "seniorities.json"; }

    @Override
    protected TypeReference<List<Seniority>> getTypeReference() {
        return new TypeReference<>() {};
    }

    public List<Seniority> findAll() {
        return readAll();
    }

    public Optional<Seniority> findById(String id) {
        return readAll().stream().filter(s -> s.getId().equals(id)).findFirst();
    }

    public Seniority save(Seniority seniority) {
        List<Seniority> all = readAll();
        all.removeIf(s -> s.getId().equals(seniority.getId()));
        all.add(seniority);
        writeAll(all);
        return seniority;
    }

    public boolean deleteById(String id) {
        List<Seniority> all = readAll();
        boolean removed = all.removeIf(s -> s.getId().equals(id));
        if (removed) writeAll(all);
        return removed;
    }
}
