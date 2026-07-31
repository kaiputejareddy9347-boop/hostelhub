package com.hostelhub.repository;

import com.hostelhub.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingStudentId(Long studentId);

    @Query("SELECT p FROM Payment p WHERE p.booking.room.hostel.owner.id = :ownerId")
    List<Payment> findByOwnerId(@Param("ownerId") Long ownerId);
}
