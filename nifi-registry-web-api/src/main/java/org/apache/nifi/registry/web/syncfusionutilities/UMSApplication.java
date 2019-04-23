package org.apache.nifi.registry.web.syncfusionutilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UMSApplication {
    
    @JsonProperty("id")
    public int Id;
    
    @JsonProperty("name")
    public String Name;
    
    @JsonProperty("url")
    public List<String> Url;
    
    @JsonProperty("application_type")
    public String Type;
    
    @JsonProperty("icon_url")
    public String Icon;
}
