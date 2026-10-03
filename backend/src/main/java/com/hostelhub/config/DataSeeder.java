package com.hostelhub.config;

import com.hostelhub.entity.Facility;
import com.hostelhub.repository.FacilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private FacilityRepository facilityRepository;

    @Override
    public void run(String... args) throws Exception {
        List<String> defaultFacilities = Arrays.asList(
            "WiFi",
            "AC",
            "CCTV Security",
            "Laundry",
            "Gym",
            "Mess / Food",
            "Hot Water",
            "Housekeeping",
            "Power Backup",
            "Attached Bathroom"
        );

        for (String name : defaultFacilities) {
            if (facilityRepository.findByName(name).isEmpty()) {
                facilityRepository.save(new Facility(name));
            }
        }
    }
}
