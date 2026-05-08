package com.projectmanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_project_permissions")
@IdClass(UserProjectPermissionId.class)
public class UserProjectPermission {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Id
    @Column(name = "project_id")
    private String projectId;

    @Column(name = "can_read")
    private boolean canRead = true;

    @Column(name = "can_write")
    private boolean canWrite = false;

    @Column(name = "can_edit")
    private boolean canEdit = false;

    @Column(name = "can_delete")
    private boolean canDelete = false;

    public UserProjectPermission() {}

    public UserProjectPermission(String userId, String projectId,
                                  boolean canRead, boolean canWrite,
                                  boolean canEdit, boolean canDelete) {
        this.userId    = userId;
        this.projectId = projectId;
        this.canRead   = canRead;
        this.canWrite  = canWrite;
        this.canEdit   = canEdit;
        this.canDelete = canDelete;
    }

    public String getUserId()    { return userId; }
    public String getProjectId() { return projectId; }
    public boolean isCanRead()   { return canRead; }
    public boolean isCanWrite()  { return canWrite; }
    public boolean isCanEdit()   { return canEdit; }
    public boolean isCanDelete() { return canDelete; }

    public void setUserId(String userId)       { this.userId = userId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public void setCanRead(boolean canRead)    { this.canRead = canRead; }
    public void setCanWrite(boolean canWrite)  { this.canWrite = canWrite; }
    public void setCanEdit(boolean canEdit)    { this.canEdit = canEdit; }
    public void setCanDelete(boolean canDelete){ this.canDelete = canDelete; }
}
