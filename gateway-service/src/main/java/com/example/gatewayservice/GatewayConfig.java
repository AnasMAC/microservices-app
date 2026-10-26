package com.example.gatewayservice;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

//    @Bean
//    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
//        return builder.routes()
//                .route("r1", r -> r.path("/customers/**").uri("http://localhost:8081/"))
//                .route("r2", r -> r.path("/products/**").uri("http://localhost:8082/"))
//                .build();
//    }

    // OR routing via Discovery Service & Load Balancer (lb://)

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("r1", r -> r.path("/customers/**").uri("lb://CUSTOMER-SERVICE"))
                .route("r2", r -> r.path("/products/**").uri("lb://INVENTORY-SERVICE"))
                .build();
    }

}