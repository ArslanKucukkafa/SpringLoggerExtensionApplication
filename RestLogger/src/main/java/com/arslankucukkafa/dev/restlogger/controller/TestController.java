package com.arslankucukkafa.dev.restlogger.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.nio.channels.FileLockInterruptionException;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    private static final Logger logger = LoggerFactory.getLogger(TestController.class);

    @GetMapping
    public String test() {
        logger.info("Test endpoint is called.");
        return "Hello World!";
    }

    @GetMapping("/1")
    public String test2() throws FileLockInterruptionException {
        if (1==1) throw new FileLockInterruptionException();
        logger.error("Test2 endpoint is called.");
        return "Hello World!";
    }

    @GetMapping("/2")
    public String test3() {
        logger.warn("Test3 endpoint is called.");
        return "Hello World!";
    }

    @GetMapping("/info")
    public String testInfo() {
        logger.info("This is an INFO log message");
        return "Info log created";
    }

    @GetMapping("/warn")
    public String testWarn() {
        logger.warn("This is a WARN log message");
        return "Warning log created";
    }

    @GetMapping("/error")
    public String testError() {
        try {
            throw new RuntimeException("Test exception");
        } catch (Exception e) {
            logger.error("This is an ERROR log message", e);
        }
        return "Error log created";
    }

    @PostMapping("/request")
    public String testRequest(@RequestBody String body) {
        logger.info("Received POST request with body: " + body);
        return "Request logged";
    }
}
