package com.hostelhub.service;

import com.hostelhub.dto.ExpenseRequest;
import com.hostelhub.dto.HostelRequest;
import com.hostelhub.dto.RoomRequest;
import com.hostelhub.entity.*;
import com.hostelhub.enums.Role;
import com.hostelhub.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class HostelService {

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ImageRepository imageRepository;

    public List<Hostel> getAllHostels(String city) {
        if (StringUtils.hasText(city)) {
            return hostelRepository.findByCityContainingIgnoreCase(city);
        }
        return hostelRepository.findAll();
    }

    public List<Hostel> getHostelsByOwner(Integer ownerId) {
        return hostelRepository.findByOwnerId(ownerId);
    }

    public Hostel getHostelById(Integer id) {
        return hostelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hostel not found"));
    }

    public Hostel createHostel(Integer ownerId, HostelRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (owner.getRole() != Role.OWNER && owner.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only property owners can list hostels");
        }

        Hostel hostel = new Hostel();
        hostel.setOwner(owner);
        hostel.setName(request.getName());
        hostel.setDescription(request.getDescription());
        hostel.setAddress(request.getAddress());
        hostel.setCity(request.getCity());
        hostel.setContactNumber(request.getContactNumber());
        hostel.setUpiId(request.getUpiId());
        hostel.setBankAccount(request.getBankAccount());
        if (request.getType() != null) hostel.setType(request.getType());
        if (request.getAllowedOccupants() != null) hostel.setAllowedOccupants(request.getAllowedOccupants());
        hostel.setMessTimetable(request.getMessTimetable());
        hostel.setGoogleMapsUrl(request.getGoogleMapsUrl());

        if (request.getFacilityIds() != null && !request.getFacilityIds().isEmpty()) {
            Set<Facility> facilities = new HashSet<>(facilityRepository.findAllById(request.getFacilityIds()));
            hostel.setFacilities(facilities);
        }

        Hostel savedHostel = hostelRepository.save(hostel);

        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (StringUtils.hasText(url)) {
                    imageRepository.save(new Image(savedHostel, url));
                }
            }
        }

        return getHostelById(savedHostel.getId());
    }

    public Room addRoomToHostel(Integer ownerId, Integer hostelId, RoomRequest request) {
        Hostel hostel = getHostelById(hostelId);

        if (!hostel.getOwner().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this hostel");
        }

        Room room = new Room();
        room.setHostel(hostel);
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        room.setCapacity(request.getCapacity());
        room.setPricePerMonth(request.getPricePerMonth());
        if (request.getStatus() != null) room.setStatus(request.getStatus());
        room.setImageUrl(request.getImageUrl());

        return roomRepository.save(room);
    }

    public Expense addExpenseToHostel(Integer ownerId, Integer hostelId, ExpenseRequest request) {
        Hostel hostel = getHostelById(hostelId);

        if (!hostel.getOwner().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this hostel");
        }

        Expense expense = new Expense();
        expense.setHostel(hostel);
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());

        return expenseRepository.save(expense);
    }
}
