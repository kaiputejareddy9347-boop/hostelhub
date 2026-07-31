package com.hostelhub.dto;

import com.hostelhub.entity.BookingStatus;

public class BookingStatusRequest {
    private BookingStatus status;

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
