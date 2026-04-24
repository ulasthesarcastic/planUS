package com.projectmanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "project_costs")
public class ProjectCost extends Auditable {

    @Id
    private String id;

    @Column(name = "project_id", nullable = false)
    private String projectId;

    @Column(name = "cost_type_id", nullable = false)
    private String costTypeId;

    private int month;
    private int year;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    public ProjectCost() {}

    public String     getId()                      { return id; }
    public void       setId(String id)             { this.id = id; }
    public String     getProjectId()               { return projectId; }
    public void       setProjectId(String v)       { this.projectId = v; }
    public String     getCostTypeId()              { return costTypeId; }
    public void       setCostTypeId(String v)      { this.costTypeId = v; }
    public int        getMonth()                   { return month; }
    public void       setMonth(int month)          { this.month = month; }
    public int        getYear()                    { return year; }
    public void       setYear(int year)            { this.year = year; }
    public BigDecimal getAmount()                  { return amount; }
    public void       setAmount(BigDecimal amount) { this.amount = amount; }
}
