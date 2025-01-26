package com.arslankucukkafa.dev.restlogger.controller;

import com.arslankucukkafa.dev.restlogger.model.Log;
import com.arslankucukkafa.dev.restlogger.service.LogService;
import org.slf4j.Logger;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LogController {
    Logger logger = org.slf4j.LoggerFactory.getLogger(LogController.class);

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping(value = "/logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Log> streamLogs() {
        return logService.getLogStream()
                .doOnError(e -> System.err.println("Error in log stream: " + e.getMessage()));
    }

    // Test endpoint'i ekleyelim
    @GetMapping("/test-log")
    public ResponseEntity<String> testLog() {
        logger.info("Test log mesajı");
        return ResponseEntity.ok("Test log gönderildi");
    }
}