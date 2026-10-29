package com.example.orderservice.dtos;

public record ProductItemRequestDTO(
        Long productId,
        int quantity
) {
}
