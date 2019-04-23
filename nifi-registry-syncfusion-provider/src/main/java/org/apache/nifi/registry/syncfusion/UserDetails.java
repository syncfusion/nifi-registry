package org.apache.nifi.registry.syncfusion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDetails {
    
    @JsonProperty("unique_name")
    public String uniqueName;
    
    @JsonProperty("upn")
    public String userPrincipalName;
    
    @JsonProperty("nameid")
    public String nameId;
    
    @JsonProperty("email")
    public String email;
    
    @JsonProperty("first_name")
    public String firstName;
    
    @JsonProperty("family_name")
    public String familyName;
    
    @JsonProperty("given_name")
    public String givenName;
    
    @JsonProperty("last_modified_date")
    public String lastModifiedDate;
    
    @JsonProperty("issued_date")
    public String issuedDate;
    
    @JsonProperty("iss")
    public String issuer;
    
    @JsonProperty("aud")
    public String audience;
    
    @JsonProperty("exp")
    public String expirationTime;
    
    @JsonProperty("nbf")
    public String notBefore;
}
