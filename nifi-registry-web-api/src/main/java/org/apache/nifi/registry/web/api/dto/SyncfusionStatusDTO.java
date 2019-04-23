package org.apache.nifi.registry.web.api.dto;

import com.wordnik.swagger.annotations.ApiModelProperty;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * A serialized representation of this class can be placed in the entity body of a response to the API. This particular entity holds the users access status.
 */
@XmlRootElement(name = "syncfusionStatus")
public class SyncfusionStatusDTO {
    
    public static enum Status {
        
        TRUE,
        FALSE
    }
 
    private String key;
    private String username;
    private String status;
    private String value;
    private String message;
    
    /**
     * @return the key
     */
    @ApiModelProperty(
            value = "Key for the value."
           
    )
    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    /**
     * @return the syncfusion status
     */
    @ApiModelProperty(
            value = "The user access status."
         
    )
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * @return the value
     */
    @ApiModelProperty(
            value = "Value for the key."
         
    )
    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
    
    /**
     * @return the syncfusion message
     */
    @ApiModelProperty(
            value = "The message to shown."
         
    )
    public String getMessage() {
        return status;
    }

    public void setMessage(String message) {
        this.message = message;
    }
    
}
