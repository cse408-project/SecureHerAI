package com.secureherai.secureherai_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/oauth2")
public class OAuth2Controller {

    @GetMapping("/success")
    public String success(@RequestParam("token") String token) {
        // Redirect to the HTML page with the token
        return "redirect:/oauth-success.html?token=" + token;
    }
}
