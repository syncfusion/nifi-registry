package org.apache.nifi.registry.web.syncfusionutilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDetails {

    @JsonProperty("username")
    public String Username;

}
