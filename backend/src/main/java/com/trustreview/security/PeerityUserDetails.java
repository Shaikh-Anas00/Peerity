package com.trustreview.security;

import com.trustreview.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;

/**
 * UserDetails implementation that carries the full {@link User} entity, so controllers can
 * read it straight off the authenticated principal (e.g. via
 * {@code @AuthenticationPrincipal PeerityUserDetails principal}) instead of re-querying the
 * database by email on every request.
 *
 * Returned by {@link com.trustreview.service.CustomUserDetailsService}. Spring Session JDBC
 * serializes the SecurityContext (including this principal) into the SPRING_SESSION table for
 * the life of the session — hence {@code implements Serializable}, matching {@link User}.
 */
public class PeerityUserDetails implements UserDetails, Serializable {

    private static final long serialVersionUID = 1L;

    private final User user;

    public PeerityUserDetails(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.isActive();
    }
}
