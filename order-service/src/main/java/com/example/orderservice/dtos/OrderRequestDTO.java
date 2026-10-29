package com.example.orderservice.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequestDTO(
        @NotNull(message = "Customer ID is required")
        Long customerId,

        @NotEmpty(message = "Order must contain at least one product item")
        @Valid
        List<ProductItemRequestDTO> productItems
) {}
