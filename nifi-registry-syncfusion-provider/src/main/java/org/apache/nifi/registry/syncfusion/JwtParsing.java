package org.apache.nifi.registry.syncfusion;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import org.apache.commons.codec.binary.Base64;

public class JwtParsing {
    
    public String getUsername(String accessToken) throws IllegalArgumentException, 
            UnsupportedEncodingException, 
            IOException {
        DecodedJWT jwt = JWT.decode(accessToken);
        String payload = new String(Base64.decodeBase64(jwt.getPayload()));
        return convertToObject(payload).userPrincipalName;
    }
    
    private UserDetails convertToObject(String value) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(value, UserDetails.class);
    }
}
