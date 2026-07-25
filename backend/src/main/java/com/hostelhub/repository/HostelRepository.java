package com.hostelhub.repository;

import com.hostelhub.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HostelRepository extends JpaRepository<Hostel, Long> {
    List<Hostel> findByCityContainingIgnoreCase(String city);
    List<Hostel> findByOwnerId(Long ownerId);
}
