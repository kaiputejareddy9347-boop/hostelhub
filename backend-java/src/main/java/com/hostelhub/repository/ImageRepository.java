package com.hostelhub.repository;

import com.hostelhub.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImageRepository extends JpaRepository<Image, Long> {
    List<Image> findByHostelId(Long hostelId);
}
