package com.example.orderservice.dtos;

import com.example.orderservice.entities.ProductItem;

import java.util.List;

public record OrderRequestDTO (Long customerId, List<ProductItemRequestDTO> productItems ){}
