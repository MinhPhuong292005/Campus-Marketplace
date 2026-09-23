package com.ioc.internship.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
public class DatabaseConfig {
    // Sẵn sàng mở rộng cấu hình nhiều DataSource hoặc Master-Replica nếu cần
}
