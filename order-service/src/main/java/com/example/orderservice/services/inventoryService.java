package com.example.orderservice.services;


import com.example.orderservice.modele.Product;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "inventory", url = "lb://INVENTORY-SERVICE")
public interface inventoryService {
    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable Long id);
    @GetMapping("/products")
    public List<Product> getProducts();
}
