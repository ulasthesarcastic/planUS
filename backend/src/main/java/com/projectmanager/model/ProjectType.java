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

    private String color;
    @Column(columnDefinition = "integer default 0")
    private int sortOrder;

    public ProjectType() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
