package com.arslankucukkafa.dev.restlogger.filter;

import com.arslankucukkafa.dev.restlogger.model.Log;
import com.arslankucukkafa.dev.restlogger.service.LogService;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class RequestLoggingFilter implements WebFilter {
    private final LogService logService;

    public RequestLoggingFilter(LogService logService) {
        this.logService = logService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // 1. Request body'yi oku
        Flux<String> bodyFlux = request.getBody()
                .map(this::getBodyAsString)
                .defaultIfEmpty("");
        
        // 2. Body ile birlikte request'i logla ve chain'e devam et
        return bodyFlux
                .doOnNext(body -> createAndEmitLog(request, body))
                .then(chain.filter(exchange));
    }

    private void createAndEmitLog(ServerHttpRequest request, String body) {
        StringBuilder message = new StringBuilder();
        message.append("URI: ").append(request.getURI()).append("\n");
        message.append("Method: ").append(request.getMethod().name()).append("\n");
        message.append("Headers: ").append(request.getHeaders());
        if (!body.isEmpty()) {
            message.append("\nBody: ").append(body);
        }

        Log log = Log.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_TIME))
                .level("INFO")
                .logger(this.getClass().getSimpleName())
                .message(message.toString())
                .requestId(request.getId())
                .build();

        logService.emitLog(log);
    }

    private String getBodyAsString(DataBuffer buffer) {
        byte[] bytes = new byte[buffer.readableByteCount()];
        buffer.read(bytes);
        return new String(bytes, StandardCharsets.UTF_8);
    }
}
