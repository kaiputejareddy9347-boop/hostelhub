package com.hostelhub.repository;

import com.hostelhub.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByStudentId(Integer studentId);
    List<Booking> findByRoomHostelOwnerId(Integer ownerId);
}
