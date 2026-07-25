package com.hostelhub.dto;

import com.hostelhub.entity.ComplaintStatus;

public class ComplaintReplyRequest {
    private String ownerReply;
    private ComplaintStatus status;

    public String getOwnerReply() { return ownerReply; }
    public void setOwnerReply(String ownerReply) { this.ownerReply = ownerReply; }

    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }
}
