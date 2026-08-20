package com.marinarodriiphoto.backend.service;

import com.cloudinary.utils.ObjectUtils;
import com.marinarodriiphoto.backend.model.Photo;
import com.marinarodriiphoto.backend.model.Project;
import com.marinarodriiphoto.backend.repository.PhotoRepository;
import com.marinarodriiphoto.backend.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final ProjectRepository projectRepository;
    private final CloudinaryService cloudinaryService;

    public PhotoService(
            PhotoRepository photoRepository,
            ProjectRepository projectRepository,
            CloudinaryService cloudinaryService) {
        this.photoRepository = photoRepository;
        this.projectRepository = projectRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public List<Photo> findByProject(Long projectId) {
        return photoRepository.findByProjectIdOrderByPositionAsc(projectId);
    }

    public Photo upload(
            Long projectId,
            MultipartFile file,
            String altText,
            Integer position) throws IOException {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Map uploadResult = cloudinaryService.upload(file);

        Photo photo = Photo.builder()
                .url(uploadResult.get("secure_url").toString())
                .publicId(uploadResult.get("public_id").toString())
                .altText(altText)
                .position(position)
                .project(project)
                .build();

        return photoRepository.save(photo);
    }

    public void delete(Long id) throws IOException {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photo not found"));

        cloudinaryService.delete(photo.getPublicId());

        photoRepository.delete(photo);
    }
}