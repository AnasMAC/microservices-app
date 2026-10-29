package com.example.orderservice.services;


import com.example.orderservice.modele.Product;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

@FeignClient(name = "inventory-service")
public interface InventoryService {
    @GetMapping("/products/{id}?projection=fullProduct")
    public Optional<Product> getProduct(@PathVariable Long id);
    @GetMapping("/products?projection=fullProduct")
    public PagedModel<Product> getProducts();
}
