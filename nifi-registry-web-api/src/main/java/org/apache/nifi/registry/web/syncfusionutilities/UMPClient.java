package org.apache.nifi.registry.web.syncfusionutilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UMPClient {
    
    @JsonProperty("umpBaseUrl")
    public String UMPBaseUrl;
    
    @JsonProperty("clientId")
    public String ClientId;
    
    @JsonProperty("clientSecret")
    public String ClientSecret;
    
    @JsonProperty("admin")
    public String Admin;
    
    @JsonProperty("packageType")
    public String PackageType;
}
