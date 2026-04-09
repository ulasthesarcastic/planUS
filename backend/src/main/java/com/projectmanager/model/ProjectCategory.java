package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "project_categories")
public class ProjectCategory {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String color;

    private int stepOrder;

    @Enumerated(EnumType.STRING)
    private CategoryType categoryType = CategoryType.PROJE;

    public enum CategoryType { PROJE, URUN, HIZMET }

    public ProjectCategory() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }

    public CategoryType getCategoryType() { return categoryType; }
    public void setCategoryType(CategoryType categoryType) { this.categoryType = categoryType; }
}
