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
        this.logSink = Sinks.many().multicast().onBackpressureBuffer();
        this.customLogAppender = new CustomLogAppender();
        setupLogAppender();
    }

    private void setupLogAppender() {
        ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(ch.qos.logback.classic.Logger.ROOT_LOGGER_NAME);
        customLogAppender.setContext(rootLogger.getLoggerContext());
        customLogAppender.start();
        rootLogger.addAppender(customLogAppender);
    }

    private class CustomLogAppender extends AppenderBase<ILoggingEvent> {
        @Override
        protected void append(ILoggingEvent event) {
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
            
            logSink.tryEmitNext(log);
        }
    }

    public Flux<Log> getLogStream() {
        return logSink.asFlux();
    }
}
