package com.example.orderservice.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

public enum OrderStatus {
    PENDING,DELIVERED,CREATED,CANCELED;
}