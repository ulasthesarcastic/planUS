package com.projectmanager.model;

import java.util.UUID;

public class Product {
    private String id;
    private String name;
    private String ownerId;       // Personnel ID referansı
    private String description;
    private int trlLevel;         // 1-9

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
