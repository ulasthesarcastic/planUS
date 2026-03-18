package com.projectmanager.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * React Router için SPA fallback — /api/** dışındaki tüm route'ları index.html'e yönlendirir.
 */
@Controller
public class SpaController {

    @RequestMapping(value = { "/", "/{path:[^\\.]*}", "/{path:[^\\.]*}/**" })
    public String forward() {
        return "forward:/index.html";
    }
}
