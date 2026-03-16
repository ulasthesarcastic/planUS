package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String ownerId;

    @Column(length = 1000)
    private String description;

    private int trlLevel;

    public Product() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getTrlLevel() { return trlLevel; }
    public void setTrlLevel(int trlLevel) { this.trlLevel = trlLevel; }
}
