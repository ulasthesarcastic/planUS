package com.projectmanager.model;

public class Personnel {
    private String id;
    private String firstName;
    private String lastName;
    private String seniorityId;

    public Personnel() {
        this.id = java.util.UUID.randomUUID().toString();
    }

    public Personnel(String firstName, String lastName, String seniorityId) {
        this();
        this.firstName = firstName;
        this.lastName = lastName;
        this.seniorityId = seniorityId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getSeniorityId() { return seniorityId; }
    public void setSeniorityId(String seniorityId) { this.seniorityId = seniorityId; }
}
