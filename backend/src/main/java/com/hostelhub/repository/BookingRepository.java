package com.hostelhub.repository;

import com.hostelhub.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByStudentId(Long studentId);

    @Query("SELECT b FROM Booking b WHERE b.room.hostel.owner.id = :ownerId")
    List<Booking> findByOwnerId(@Param("ownerId") Long ownerId);
}
