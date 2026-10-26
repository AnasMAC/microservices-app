package com.example.orderservice.services;


import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Customer;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "Customer", url = "lb://CUSTOMER-SERVICE")
public interface CustomerService {
    @GetMapping("/customers/{id}")
    public Customer findById(@PathVariable long id);
    @GetMapping("/customers")
    public List<Customer> findAll();
}
