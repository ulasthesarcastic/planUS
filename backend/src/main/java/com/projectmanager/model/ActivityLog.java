package com.projectmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_log")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 60)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "entity_name")
    private String entityName;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "actor", length = 100)
    private String actor;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ActivityLog() {}

    public ActivityLog(String entityType, String entityId, String entityName,
                       String action, String actor, String detail) {
        this.entityType = entityType;
        this.entityId   = entityId;
        this.entityName = entityName;
        this.action     = action;
        this.actor      = actor;
        this.detail     = detail;
        this.createdAt  = LocalDateTime.now();
    }

    public Long getId()            { return id; }
    public String getEntityType()  { return entityType; }
    public String getEntityId()    { return entityId; }
    public String getEntityName()  { return entityName; }
    public String getAction()      { return action; }
    public String getActor()       { return actor; }
    public String getDetail()      { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
