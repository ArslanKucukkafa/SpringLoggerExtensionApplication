package com.arslankucukkafa.dev.restlogger.service;

import com.arslankucukkafa.dev.restlogger.model.Log;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import java.time.format.DateTimeFormatter;

@Service
public class LogService {
    private final Sinks.Many<Log> logSink;
    private final CustomLogAppender customLogAppender;

    public LogService() {
        // Using replay().all() to buffer all events
        this.logSink = Sinks.many().replay().all();
        this.customLogAppender = new CustomLogAppender();
        setupLogAppender();
        System.out.println("LogService initialized");
    }

    private void setupLogAppender() {
        ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
        customLogAppender.setContext(rootLogger.getLoggerContext());
        customLogAppender.start();
        rootLogger.addAppender(customLogAppender);
        System.out.println("Log appender setup completed");
    }

    public void emitLog(Log log) {
        System.out.println("Emitting log: " + log.getMessage());
        Sinks.EmitResult result = logSink.tryEmitNext(log);
        if (result.isFailure()) {
            System.err.println("Failed to emit log: " + result);
        }
    }

    private class CustomLogAppender extends AppenderBase<ILoggingEvent> {
        @Override
        protected void append(ILoggingEvent event) {
            System.out.println("Appender received event: " + event.getMessage());
            Log log = Log.builder()
                    .timestamp(event.getTimeStamp() != 0 ? 
                             DateTimeFormatter.ISO_LOCAL_TIME.format(java.time.Instant.ofEpochMilli(event.getTimeStamp())
                                     .atZone(java.time.ZoneId.systemDefault())
                                     .toLocalDateTime()) : 
                             java.time.LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_TIME))
                    .level(event.getLevel().toString())
                    .logger(event.getLoggerName())
                    .message(event.getFormattedMessage())
                    .build();
            
            if (event.getThrowableProxy() != null) {
                log.setStackTrace(event.getThrowableProxy().getMessage());
            }
            
            Sinks.EmitResult result = logSink.tryEmitNext(log);
            if (result.isFailure()) {
                System.err.println("Failed to emit log in appender: " + result);
            }
        }
    }

    public Flux<Log> getLogStream() {
        System.out.println("New client connected to log stream");
        return logSink.asFlux()
                .doOnSubscribe(s -> System.out.println("Client subscribed to log stream"))
                .doOnNext(log -> System.out.println("Sending log to client: " + log.getMessage()))
                .doOnCancel(() -> System.out.println("Client disconnected from log stream"))
                .doOnError(error -> System.err.println("Error in log stream: " + error.getMessage()))
                .doOnComplete(() -> System.out.println("Log stream completed"));
    }
}
