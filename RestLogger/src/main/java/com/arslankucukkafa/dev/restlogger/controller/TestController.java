package com.arslankucukkafa.dev.restlogger.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final Logger logger = LoggerFactory.getLogger(TestController.class);

    @GetMapping
    public String test() {
        logger.info("Test endpoint is called.");
        return "Hello World!";
    }

    @GetMapping("/1")
    public String test2() {
        logger.error("Test2 endpoint is called.");
        return "Hello World!";
    }

    @GetMapping("/2")
    public String test3() {
        logger.warn("Test3 endpoint is called.");
        return "Hello World!";
    }

}
