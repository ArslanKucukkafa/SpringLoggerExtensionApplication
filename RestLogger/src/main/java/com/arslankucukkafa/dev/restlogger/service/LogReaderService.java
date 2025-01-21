package com.arslankucukkafa.dev.restlogger.service;

import com.arslankucukkafa.dev.restlogger.model.Log;
import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListener;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LogReaderService {
    private final Sinks.Many<Log> logSink;
    private final Pattern logPattern;
    private Tailer tailer;
    
    @Value("${logging.file.path:logs/application.log}")
    private String logFilePath;

    public LogReaderService() {
        this.logSink = Sinks.many().multicast().onBackpressureBuffer();
        
        // Log4j/Logback benzeri log formatı için pattern
        this.logPattern = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2})\\s+" + // timestamp
            "(\\w+)\\s+" +                                          // log level
            "([\\w.]+)\\s+-\\s+" +                                 // logger name
            "(.+?)\\s*" +                                          // message
            "(?:\\n(.*?))?$",                                      // stack trace (optional)
            Pattern.DOTALL
        );
    }

    public void startReading() {
        File logFile = new File(logFilePath);
        if (!logFile.getParentFile().exists()) {
            logFile.getParentFile().mkdirs();
        }
        
        TailerListener listener = new TailerListener() {
            @Override
            public void handle(String line) {
                try {
                    Log log = parseLine(line);
                    if (log != null) {
                        logSink.tryEmitNext(log);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void handle(Exception ex) {
                ex.printStackTrace();
            }

            @Override
            public void fileNotFound() {
                System.err.println("Log file not found: " + logFilePath);
            }

            @Override
            public void fileRotated() {
                // Dosya değiştiğinde yapılacak işlemler
            }

            @Override
            public void init(Tailer tailer) {
                // Başlangıç işlemleri
            }
        };

        this.tailer = Tailer.create(logFile, listener, 1000, true);
    }

    private Log parseLine(String line) {
        Matcher matcher = logPattern.matcher(line);
        if (matcher.find()) {
            return Log.builder()
                    .timestamp(matcher.group(1))
                    .level(matcher.group(2))
                    .logger(matcher.group(3))
                    .message(matcher.group(4))
                    .stackTrace(matcher.group(5))
                    .build();
        }
        return null;
    }

    public Flux<Log> getLogStream() {
        return logSink.asFlux();
    }

    public void stop() {
        if (tailer != null) {
            tailer.stop();
        }
    }
}
