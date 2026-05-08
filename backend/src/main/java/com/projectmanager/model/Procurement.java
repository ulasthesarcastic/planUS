package com.projectmanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "project_procurements")
public class Procurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private String projectId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "planned_amount", precision = 15, scale = 2)
    private BigDecimal plannedAmount;

    @Column(name = "planned_month")
    private Integer plannedMonth;

    @Column(name = "planned_year")
    private Integer plannedYear;

    @Column(name = "actual_amount", precision = 15, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "actual_month")
    private Integer actualMonth;

    @Column(name = "actual_year")
    private Integer actualYear;

    public Procurement() {}

    public Long        getId()                         { return id; }
    public void        setId(Long id)                  { this.id = id; }
    public String      getProjectId()                  { return projectId; }
    public void        setProjectId(String v)          { this.projectId = v; }
    public String      getDescription()                { return description; }
    public void        setDescription(String v)        { this.description = v; }
    public BigDecimal  getPlannedAmount()              { return plannedAmount; }
    public void        setPlannedAmount(BigDecimal v)  { this.plannedAmount = v; }
    public Integer     getPlannedMonth()               { return plannedMonth; }
    public void        setPlannedMonth(Integer v)      { this.plannedMonth = v; }
    public Integer     getPlannedYear()                { return plannedYear; }
    public void        setPlannedYear(Integer v)       { this.plannedYear = v; }
    public BigDecimal  getActualAmount()               { return actualAmount; }
    public void        setActualAmount(BigDecimal v)   { this.actualAmount = v; }
    public Integer     getActualMonth()                { return actualMonth; }
    public void        setActualMonth(Integer v)       { this.actualMonth = v; }
    public Integer     getActualYear()                 { return actualYear; }
    public void        setActualYear(Integer v)        { this.actualYear = v; }
}
