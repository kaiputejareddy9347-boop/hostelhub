package com.hostelhub.repository;

import com.hostelhub.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
    Optional<Facility> findByName(String name);
}
