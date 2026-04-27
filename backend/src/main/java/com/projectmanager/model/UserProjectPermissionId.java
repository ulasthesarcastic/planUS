package com.projectmanager.model;

import java.io.Serializable;
import java.util.Objects;

public class UserProjectPermissionId implements Serializable {
    private String userId;
    private String projectId;

    public UserProjectPermissionId() {}
    public UserProjectPermissionId(String userId, String projectId) {
        this.userId = userId;
        this.projectId = projectId;
    }

    public String getUserId() { return userId; }
    public String getProjectId() { return projectId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserProjectPermissionId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(projectId, that.projectId);
    }
    @Override public int hashCode() { return Objects.hash(userId, projectId); }
}
