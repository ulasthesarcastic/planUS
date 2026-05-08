package com.projectmanager.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "personnel_seniority_history")
public class PersonnelSeniorityHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "personnel_id", nullable = false)
    private String personnelId;

    @Column(name = "seniority_id", nullable = false)
    private String seniorityId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    public PersonnelSeniorityHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPersonnelId() { return personnelId; }
    public void setPersonnelId(String personnelId) { this.personnelId = personnelId; }
    public String getSeniorityId() { return seniorityId; }
    public void setSeniorityId(String seniorityId) { this.seniorityId = seniorityId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
