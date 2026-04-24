package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Tüm denetlenebilir entity'lerin miras aldığı temel sınıf.
 * Oluşturan/güncelleyen kişi ve zaman damgaları Spring Data JPA tarafından otomatik doldurulur.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public String getCreatedBy()        { return createdBy; }
    @JsonIgnore
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getUpdatedBy()        { return updatedBy; }
    @JsonIgnore
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
