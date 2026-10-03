package com.hostelhub.service;

import com.hostelhub.dto.ComplaintReplyRequest;
import com.hostelhub.dto.ComplaintRequest;
import com.hostelhub.entity.Complaint;
import com.hostelhub.entity.Hostel;
import com.hostelhub.entity.User;
import com.hostelhub.enums.ComplaintStatus;
import com.hostelhub.enums.Role;
import com.hostelhub.repository.ComplaintRepository;
import com.hostelhub.repository.HostelRepository;
import com.hostelhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HostelRepository hostelRepository;

    public Complaint createComplaint(Integer studentId, ComplaintRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        if (student.getRole() != Role.STUDENT && student.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can log complaints");
        }

        Hostel hostel = hostelRepository.findById(request.getHostelId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hostel not found"));

        Complaint complaint = new Complaint();
        complaint.setStudent(student);
        complaint.setHostel(hostel);
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setStatus(ComplaintStatus.OPEN);

        return complaintRepository.save(complaint);
    }

    public List<Complaint> getStudentComplaints(Integer studentId) {
        return complaintRepository.findByStudentId(studentId);
    }

    public List<Complaint> getOwnerComplaints(Integer ownerId) {
        return complaintRepository.findByHostelOwnerId(ownerId);
    }

    public Complaint replyToComplaint(Integer ownerId, Integer complaintId, ComplaintReplyRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (!complaint.getHostel().getOwner().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this hostel listing");
        }

        complaint.setOwnerReply(request.getOwnerReply());
        complaint.setStatus(ComplaintStatus.RESOLVED);

        return complaintRepository.save(complaint);
    }
}
