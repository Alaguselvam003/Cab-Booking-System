package com.example.Cab.Booking.System;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.beans.factory.annotation.Autowired;
import com.example.Cab.Booking.System.service.AuthService;
import com.example.Cab.Booking.System.dto.RegisterRequest;
import com.example.Cab.Booking.System.entity.User;

@SpringBootTest
class CabBookingSystemApplicationTests {

	@Autowired
	private AuthService authService;

	@Test
	void contextLoads() {
	}

	@Test
	void testDriverRegistration() {
		RegisterRequest req = new RegisterRequest();
		req.setName("Test Driver");
		req.setEmail("testdriver_" + System.currentTimeMillis() + "@example.com");
		req.setPassword("password");
		req.setPhone(1234567890L);
		req.setRole("driver");
		req.setLicensenumber(System.currentTimeMillis());
		req.setVehicleType("Sedan");
		req.setNumberplate("PLATE_" + System.currentTimeMillis());
		req.setCapacity(4);

		User user = authService.register(req);
		org.junit.jupiter.api.Assertions.assertNotNull(user);
		org.junit.jupiter.api.Assertions.assertEquals("driver", user.getRole());
	}
}
