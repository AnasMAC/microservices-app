package com.example.inventoryservice;

import com.example.inventoryservice.entities.Product;
import com.example.inventoryservice.repositories.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class InventoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner start(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                List<Product> products = List.of(
                    new Product(null, "MacBook Pro M3", 1999.00, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"),
                    new Product(null, "iPhone 15 Pro", 1199.00, "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80"),
                    new Product(null, "Sony WH-1000XM5", 399.00, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"),
                    new Product(null, "Dell UltraSharp 4K", 649.00, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80"),
                    new Product(null, "Keychron Q1 Pro Keyboard", 199.00, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80"),
                    new Product(null, "Logitech MX Master 3S", 99.00, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80"),
                    new Product(null, "iPad Air M2", 599.00, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80"),
                    new Product(null, "Apple Watch Ultra 2", 799.00, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"),
                    new Product(null, "Bose QuietComfort 45", 329.00, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80"),
                    new Product(null, "Canon EOS R6 Camera", 2499.00, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80")
                );
                productRepository.saveAll(products);
            }
            productRepository.findAll().forEach(System.out::println);
        };
    }
}
