package com.arslankucukkafa.dev.restlogger.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Log {
    private String timestamp;
    private String level;
    private String logger;
    private String message;
    private String threadName;
    private String stackTrace;
}
