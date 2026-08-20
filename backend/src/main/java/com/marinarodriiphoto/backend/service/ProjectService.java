package com.marinarodriiphoto.backend.service;

import com.marinarodriiphoto.backend.model.Project;
import com.marinarodriiphoto.backend.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project create(Project project) {
        return projectRepository.save(project);
    }

    public Project update(Long id, Project updatedProject) {
        Project project = findById(id);

        project.setTitle(updatedProject.getTitle());
        project.setSlug(updatedProject.getSlug());
        project.setDescription(updatedProject.getDescription());
        project.setYear(updatedProject.getYear());
        project.setRecognition(updatedProject.getRecognition());
        project.setCoverImageUrl(updatedProject.getCoverImageUrl());
        project.setCoverImagePublicId(updatedProject.getCoverImagePublicId());
        project.setPublished(updatedProject.getPublished());
        project.setDisplayOrder(updatedProject.getDisplayOrder());

        return projectRepository.save(project);
    }

    public void delete(Long id) {
        Project project = findById(id);
        projectRepository.delete(project);
    }
}