package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "project_types")
public class ProjectType {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    public ProjectType() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
