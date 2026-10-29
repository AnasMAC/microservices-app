package com.example.orderservice.dtos;

import com.example.orderservice.modele.Product;

public record ProductItemResponseDTO(
        Long id,
        Product product,
        double price,
        int quantity
) {
}
