package com.example.orderservice.dtos;

import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Customer;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponseDTO(
        Long id,
        LocalDateTime orderDate,
        OrderStatus orderStatus,
        Customer customer,
        List<ProductItemResponseDTO> productItems
) {
}
