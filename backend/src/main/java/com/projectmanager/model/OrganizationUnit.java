package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "organization_units")
public class OrganizationUnit {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    // null ise üst birim, dolu ise alt birim
    private String parentId;

    public OrganizationUnit() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
}
