package com.example.orderservice.services;


import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Customer;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Optional;

@FeignClient(name = "customer-service")
public interface CustomerService {
    @GetMapping("/customers/{id}?projection=fullCustomer")
    public Optional<Customer> findById(@PathVariable long id);
    @GetMapping("/customers?projection=fullCustomer")
    PagedModel<Customer> findAll();
}
