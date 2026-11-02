package com.trustreview;

import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Spring Session JDBC serializes the SecurityContext (including the authenticated principal)
 * into the SPRING_SESSION table for the life of the session (dev/prod run with
 * spring.session.store-type=jdbc). The test suite itself runs with store-type=none, so a
 * @SpringBootTest alone would never catch a NotSerializableException here — this test proves
 * PeerityUserDetails (and the User entity it wraps) survive a real Java serialization
 * round-trip, which is why both classes implement Serializable.
 */
@DisplayName("PeerityUserDetails Serialization — required for Spring Session JDBC")
class PeerityUserDetailsSerializationTest {

    @Test
    @DisplayName("PeerityUserDetails survives a Java serialization round-trip with all User fields intact")
    void peerityUserDetails_survivesSerializationRoundTrip() throws Exception {
        User user = new User(
                "serialize_me@trustreview.edu",
                "hashed_pw",
                "Serialize Me",
                Role.STUDENT,
                "Apex Institute",
                "Computer Science"
        );
        PeerityUserDetails original = new PeerityUserDetails(user);

        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(byteStream)) {
            out.writeObject(original);
        }

        PeerityUserDetails deserialized;
        try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(byteStream.toByteArray()))) {
            deserialized = (PeerityUserDetails) in.readObject();
        }

        assertEquals(original.getUsername(), deserialized.getUsername());
        assertEquals(original.getUser().getId(), deserialized.getUser().getId());
        assertEquals(original.getUser().getEmail(), deserialized.getUser().getEmail());
        assertEquals(original.getUser().getRole(), deserialized.getUser().getRole());
        assertEquals(original.getUser().getFullName(), deserialized.getUser().getFullName());
        assertTrue(deserialized.isEnabled());
        assertEquals(1, deserialized.getAuthorities().size());
        assertEquals("ROLE_STUDENT", deserialized.getAuthorities().iterator().next().getAuthority());
    }
}
