package com.arslankucukkafa.dev.restlogger.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Log {
    private String timestamp;
    private String level;
    private String logger;
    private String message;
    private String requestId; // İsteği tanımlamak için
    private String stackTrace;
}
