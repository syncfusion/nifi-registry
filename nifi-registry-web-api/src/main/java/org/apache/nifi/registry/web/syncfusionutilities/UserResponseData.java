package org.apache.nifi.registry.web.syncfusionutilities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponseData {
    
    @JsonProperty("data")
    public List<UserDetails> Data;
    
    @JsonProperty("total_results")
    public long TotalCount;
    
}
