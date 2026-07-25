package com.hostelhub.controller;

import com.hostelhub.config.UserDetailsImpl;
import com.hostelhub.dto.ComplaintRequest;
import com.hostelhub.dto.ComplaintReplyRequest;
import com.hostelhub.entity.*;
import com.hostelhub.repository.ComplaintRepository;
import com.hostelhub.repository.HostelRepository;
import com.hostelhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> raiseComplaint(@RequestBody ComplaintRequest request) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> studentOpt = userRepository.findById(userPrincipal.getId());
        Optional<Hostel> hostelOpt = hostelRepository.findById(request.getHostelId());

        if (studentOpt.isEmpty() || hostelOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid student or hostel reference.");
        }

        Complaint complaint = new Complaint(
            studentOpt.get(),
            hostelOpt.get(),
            request.getTitle(),
            request.getDescription(),
            ComplaintStatus.OPEN
        );

        Complaint saved = complaintRepository.save(complaint);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Complaint>> getStudentComplaints() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Complaint> complaints = complaintRepository.findByStudentId(userPrincipal.getId());
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<Complaint>> getOwnerComplaints() {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Complaint> complaints = complaintRepository.findByOwnerId(userPrincipal.getId());
        return ResponseEntity.ok(complaints);
    }

    @PutMapping("/{id}/reply")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> replyToComplaint(@PathVariable Long id, @RequestBody ComplaintReplyRequest replyRequest) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Complaint> complaintOpt = complaintRepository.findById(id);

        if (complaintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Complaint not found");
        }

        Complaint complaint = complaintOpt.get();
        if (!complaint.getHostel().getOwner().getId().equals(userPrincipal.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this hostel");
        }

        complaint.setOwnerReply(replyRequest.getOwnerReply());
        if (replyRequest.getStatus() != null) {
            complaint.setStatus(replyRequest.getStatus());
        }

        Complaint updated = complaintRepository.save(complaint);
        return ResponseEntity.ok(updated);
    }
}
