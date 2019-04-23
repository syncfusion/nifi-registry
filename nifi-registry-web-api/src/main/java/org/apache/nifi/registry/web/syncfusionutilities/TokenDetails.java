package org.apache.nifi.registry.web.syncfusionutilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenDetails {

    @JsonProperty("access_token")
    public String Access_Token;

    @JsonProperty("token_type")
    public String Token_Type;

    @JsonProperty("expires_in")
    public String Expires_In;

    @JsonProperty("clientId")
    public String CliendId;

    @JsonProperty("ApplicationStatus")
    public String ApplicationStatus;

    @JsonProperty(".issued")
    public String Issued;

    @JsonProperty(".expires")
    public String Expires;
}
