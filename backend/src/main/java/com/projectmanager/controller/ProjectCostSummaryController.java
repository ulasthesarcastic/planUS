package com.projectmanager.controller;

import com.projectmanager.model.ProjectCost;
import com.projectmanager.service.ProjectCostService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-costs")
public class ProjectCostSummaryController {

    private final ProjectCostService service;

    public ProjectCostSummaryController(ProjectCostService service) { this.service = service; }

    @GetMapping
    public List<ProjectCost> getAll() { return service.getAll(); }
}
