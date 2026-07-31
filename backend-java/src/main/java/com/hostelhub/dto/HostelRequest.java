package com.hostelhub.dto;

import java.util.List;

public class HostelRequest {
    private String name;
    private String description;
    private String address;
    private String city;
    private String contactNumber;
    private List<Long> facilityIds;
    private List<String> imageUrls;
    private String upiId;
    private String bankAccount;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public List<Long> getFacilityIds() { return facilityIds; }
    public void setFacilityIds(List<Long> facilityIds) { this.facilityIds = facilityIds; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getBankAccount() { return bankAccount; }
    public void setBankAccount(String bankAccount) { this.bankAccount = bankAccount; }
}
