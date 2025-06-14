package com.secureherai.secureherai_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SecureHerAiApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SecureHerAiApiApplication.class, args);
	}

}
