package com.marinarodriiphoto.backend.repository;

import com.marinarodriiphoto.backend.model.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findByProjectIdOrderByPositionAsc(Long projectId);
}