package com.example.orderservice.dtos;

import com.example.orderservice.entities.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponseDTO(
        Long id,
        LocalDateTime orderDate,
        OrderStatus orderStatus,
        Long customerId,
        List<ProductItemResponseDTO> productItems
) {
}
