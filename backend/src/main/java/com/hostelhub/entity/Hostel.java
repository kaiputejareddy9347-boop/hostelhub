package com.hostelhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hostelhub.enums.OccupantType;
import com.hostelhub.enums.PropertyType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "hostels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Hostel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "owner_id", insertable = false, updatable = false)
    private Integer ownerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"hostels", "bookings", "complaints", "reviews", "password"})
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "bank_account")
    private String bankAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyType type = PropertyType.HOSTEL;

    @Enumerated(EnumType.STRING)
    @Column(name = "allowed_occupants", nullable = false)
    private OccupantType allowedOccupants = OccupantType.ANY;

    @Column(name = "mess_timetable", columnDefinition = "TEXT")
    private String messTimetable;

    @Column(name = "google_maps_url")
    private String googleMapsUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Room> rooms = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "_HostelFacilities",
        joinColumns = @JoinColumn(name = "A"),
        inverseJoinColumns = @JoinColumn(name = "B")
    )
    private Set<Facility> facilities = new HashSet<>();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Image> images = new ArrayList<>();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Complaint> complaints = new ArrayList<>();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Notice> notices = new ArrayList<>();

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("hostel")
    private List<Expense> expenses = new ArrayList<>();
}
