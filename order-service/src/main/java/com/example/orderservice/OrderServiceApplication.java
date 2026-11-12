package com.example.orderservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }

//    @Bean
//    public CommandLineRunner orderSeed(
//            OrderRepository orderRepository,
//            CustomerService customerService,
//            InventoryService inventoryService
//    ){
//
//
//
//        return (String... args) ->{
//            List<Product> products = inventoryService.getProducts().getContent().stream().toList();
//
//            customerService.findAll().getContent().forEach(customer -> {
//                for(int i = 0 ; i<10;i++){
//                    Order order = new Order();
//                    order.setOrderDate(LocalDateTime.now());
//                    order.setOrderStatus(OrderStatus.values()[i % 4]);
//                    order.setCustomerId(customer.getId());
//
//                    List<ProductItem> productItems = products.stream().map(product -> {
//                        ProductItem productItem = new ProductItem();
//                        productItem.setProductId(product.getId());
//                        productItem.setPrice(product.getPrice() * 3);
//                        productItem.setQuantity(1 + (int)(Math.random() * 5)); // Set quantity
//                        productItem.setOrder(order);
//                        return productItem;
//                    }).toList();
//
//                    order.setProductItems(productItems);
//
//                    orderRepository.save(order);
//                }
//            });
//        };
//    }

}
