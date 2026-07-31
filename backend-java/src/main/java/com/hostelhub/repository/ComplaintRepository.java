package com.hostelhub.repository;

import com.hostelhub.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByStudentId(Long studentId);

    @Query("SELECT c FROM Complaint c WHERE c.hostel.owner.id = :ownerId")
    List<Complaint> findByOwnerId(@Param("ownerId") Long ownerId);
}
