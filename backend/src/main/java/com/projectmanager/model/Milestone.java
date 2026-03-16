package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "milestones")
public class Milestone {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonBackReference("project-milestones")
    private Project project;

    private String name;
    private String description;
    private int month;
    private int year;
    private boolean completed;
    private Integer completedMonth;
    private Integer completedYear;

    public Milestone() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Integer getCompletedMonth() { return completedMonth; }
    public void setCompletedMonth(Integer completedMonth) { this.completedMonth = completedMonth; }
    public Integer getCompletedYear() { return completedYear; }
    public void setCompletedYear(Integer completedYear) { this.completedYear = completedYear; }
}
