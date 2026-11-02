package com.trustreview.service;

import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.security.PeerityUserDetails;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("User account is deactivated");
        }

        // Carries the full User entity on the principal so controllers can read it directly
        // (via @AuthenticationPrincipal PeerityUserDetails) instead of re-querying by email.
        return new PeerityUserDetails(user);
    }
}
