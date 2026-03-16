package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "resource_entries")
public class ResourceEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonBackReference("project-resources")
    private Project project;

    private String personnelId;
    private int month;
    private int year;
    private Double need;
    private Double planned;
    private Double actual;

    public ResourceEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getPersonnelId() { return personnelId; }
    public void setPersonnelId(String personnelId) { this.personnelId = personnelId; }
    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public Double getNeed() { return need; }
    public void setNeed(Double need) { this.need = need; }
    public Double getPlanned() { return planned; }
    public void setPlanned(Double planned) { this.planned = planned; }
    public Double getActual() { return actual; }
    public void setActual(Double actual) { this.actual = actual; }
}
