package com.projectmanager.repository;

import com.projectmanager.model.UserProjectPermission;
import com.projectmanager.model.UserProjectPermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserProjectPermissionRepository
        extends JpaRepository<UserProjectPermission, UserProjectPermissionId> {

    List<UserProjectPermission> findByUserId(String userId);
    Optional<UserProjectPermission> findByUserIdAndProjectId(String userId, String projectId);
    void deleteByUserId(String userId);
    void deleteByProjectId(String projectId);
}
