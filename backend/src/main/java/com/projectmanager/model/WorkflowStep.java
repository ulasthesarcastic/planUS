package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workflow_steps")
public class WorkflowStep {

    @Id
    private String id;

    private String categoryId;

    private String label;

    private String stepType; // START | NORMAL | TERMINAL_SUCCESS | TERMINAL_FAILURE

    private int positionX;

    private int positionY;

    private int stepOrder;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "workflow_step_transitions", joinColumns = @JoinColumn(name = "step_id"))
    @Column(name = "target_step_id")
    private List<String> transitions = new ArrayList<>();

    public WorkflowStep() {
        this.id = UUID.randomUUID().toString();
        this.transitions = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getStepType() { return stepType; }
    public void setStepType(String stepType) { this.stepType = stepType; }

    public int getPositionX() { return positionX; }
    public void setPositionX(int positionX) { this.positionX = positionX; }

    public int getPositionY() { return positionY; }
    public void setPositionY(int positionY) { this.positionY = positionY; }

    public int getStepOrder() { return stepOrder; }
    public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }

    public List<String> getTransitions() { return transitions; }
    public void setTransitions(List<String> transitions) { this.transitions = transitions; }
}
