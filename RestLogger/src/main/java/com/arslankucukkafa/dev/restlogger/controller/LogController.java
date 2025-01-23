package com.arslankucukkafa.dev.restlogger.controller;

import com.arslankucukkafa.dev.restlogger.model.Log;
import com.arslankucukkafa.dev.restlogger.service.LogService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
public class LogController {
    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Log> streamLogs() {
        return logService.getLogStream()
                .onErrorContinue((error, obj) -> {
                    // Log the error but continue streaming
                    System.err.println("Error in log stream: " + error.getMessage());
                });
    }
}
