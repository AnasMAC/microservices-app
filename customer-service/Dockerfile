# 1. Base image: Use a lightweight JRE (not the heavy JDK)
FROM eclipse-temurin:17-jre-alpine

# 2. Working directory inside the container
WORKDIR /app

# 3. Copy the compiled JAR file from your host machine into the container
COPY target/*.jar app.jar

# 4. Expose the port (e.g. 8083 for order-service)
EXPOSE 8083

# 5. The command to start the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
