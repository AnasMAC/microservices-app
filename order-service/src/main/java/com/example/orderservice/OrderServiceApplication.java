package com.example.orderservice;

import com.example.orderservice.entities.Order;
import com.example.orderservice.entities.OrderStatus;
import com.example.orderservice.entities.ProductItem;
import com.example.orderservice.modele.Product;
import com.example.orderservice.repositories.OrderRepository;
import com.example.orderservice.repositories.ProductItemRepository;
import com.example.orderservice.services.CustomerService;
import com.example.orderservice.services.InventoryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner orderSeed(
            OrderRepository orderRepository,
            CustomerService customerService,
            InventoryService inventoryService
    ){



        return (String... args) ->{
            List<Product> products = inventoryService.getProducts().getContent().stream().toList();

            customerService.findAll().getContent().forEach(customer -> {
                for(int i = 0 ; i<10;i++){
                    Order order = new Order();
                    order.setOrderDate(LocalDateTime.now());
                    order.setOrderStatus(OrderStatus.values()[i % 4]);
                    order.setCustomerId(customer.getId());

                    List<ProductItem> productItems = products.stream().map(product -> {
                        ProductItem productItem = new ProductItem();
                        productItem.setProductId(product.getId());
                        productItem.setPrice(product.getPrice() * 3);
                        productItem.setQuantity(1 + (int)(Math.random() * 5)); // Set quantity
                        productItem.setOrder(order);
                        return productItem;
                    }).toList();

                    order.setProductItems(productItems);

                    orderRepository.save(order);
                }
            });
        };
    }

}
