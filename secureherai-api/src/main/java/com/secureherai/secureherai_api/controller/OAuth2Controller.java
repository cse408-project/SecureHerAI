package com.secureherai.secureherai_api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

import java.util.logging.Logger;

@Controller
@RequestMapping("/oauth2")
public class OAuth2Controller {
    private static final Logger LOGGER = Logger.getLogger(OAuth2Controller.class.getName());
    
    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    @GetMapping("/success")
    public RedirectView success(@RequestParam("token") String token) {
        // Redirect to the frontend app with the token
        String redirectUrl = frontendUrl + "/dashboard?token=" + token;
        LOGGER.info("Redirecting to frontend: " + redirectUrl);
        return new RedirectView(redirectUrl);
    }
}
