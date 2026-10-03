package com.hostelhub.repository;

import com.hostelhub.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HostelRepository extends JpaRepository<Hostel, Integer> {
    List<Hostel> findByOwnerId(Integer ownerId);
    List<Hostel> findByCityContainingIgnoreCase(String city);
}
