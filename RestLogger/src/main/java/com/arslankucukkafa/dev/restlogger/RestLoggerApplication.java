package com.arslankucukkafa.dev.restlogger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RestLoggerApplication {

    public static void main(String[] args) {
        SpringApplication.run(RestLoggerApplication.class, args);
    }

}
