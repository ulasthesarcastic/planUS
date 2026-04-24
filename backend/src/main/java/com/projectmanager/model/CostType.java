package com.projectmanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cost_types")
public class CostType extends Auditable {

    @Id
    private String id;

    private String name;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public CostType() {}

    public String getId()                   { return id; }
    public void   setId(String id)          { this.id = id; }
    public String getName()                 { return name; }
    public void   setName(String name)      { this.name = name; }
    public Integer getDisplayOrder()        { return displayOrder; }
    public void    setDisplayOrder(Integer v){ this.displayOrder = v; }
}
