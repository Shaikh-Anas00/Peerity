package com.trustreview.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Utility to securely resolve the client's real IP address.
 * Prevents IP spoofing in rate limiting and audit logging by only trusting
 * the X-Forwarded-For header when the direct remote address is a configured trusted proxy.
 */
@Component
public class ClientIpResolver {

    private final List<String> trustedProxies;

    public ClientIpResolver(@Value("${trustreview.trusted-proxies:127.0.0.1,::1,0:0:0:0:0:0:0:1}") String proxies) {
        this.trustedProxies = Arrays.stream(proxies.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && isTrustedProxy(remoteAddr)) {
            String xf = request.getHeader("X-Forwarded-For");
            if (xf != null && !xf.isBlank()) {
                return xf.split(",")[0].trim();
            }
        }

        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
    }

    public boolean isTrustedProxy(String ip) {
        if (ip == null) return false;
        return trustedProxies.contains(ip.trim());
    }
}
