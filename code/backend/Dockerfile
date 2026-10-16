# Multi-stage Docker build for Spring Boot 3 & Java 17

# Stage 1: Build JAR with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Download dependencies separately to leverage Docker layer caching
COPY pom.xml .
RUN mvn -B dependency:go-offline || mvn -B dependency:resolve

# Copy application source code and compile
COPY src ./src
RUN mvn -B clean package -DskipTests

# Stage 2: Minimal JRE 17 runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create upload directory
RUN mkdir -p /app/uploads

# Copy built jar from builder stage
COPY --from=build /app/target/*.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Production default environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/v1/swagger-ui.html || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
