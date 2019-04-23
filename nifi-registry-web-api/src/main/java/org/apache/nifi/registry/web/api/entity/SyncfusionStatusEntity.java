package org.apache.nifi.registry.web.api.entity;

import javax.xml.bind.annotation.XmlRootElement;
import org.apache.nifi.registry.web.api.dto.SyncfusionStatusDTO;

/**
 * A serialized representation of this class can be placed in the entity body of a request or response to or from the API. This particular entity holds a reference to a AccessStatusDTO.
 */
@XmlRootElement(name = "syncfusionStatusEntity")
public class SyncfusionStatusEntity extends Entity {
    
    private SyncfusionStatusDTO syncfusionStatus;

    /**
     * The SyncfusionStatusDTO that is being serialized.
     *
     * @return The SyncfusionStatusDTO object
     */
    public SyncfusionStatusDTO getAccessStatus() {
        return syncfusionStatus;
    }

    public void setAccessStatus(SyncfusionStatusDTO syncfusionStatus) {
        this.syncfusionStatus = syncfusionStatus;
    }
    
}
