
package org.apache.nifi.registry.syncfusion;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.apache.nifi.registry.security.authentication.AuthenticationRequest;
import org.apache.nifi.registry.security.authentication.AuthenticationResponse;
import org.apache.nifi.registry.security.authentication.BasicAuthIdentityProvider;
import org.apache.nifi.registry.security.authentication.IdentityProvider;
import org.apache.nifi.registry.security.authentication.IdentityProviderConfigurationContext;
import org.apache.nifi.registry.security.authentication.exception.IdentityAccessException;
import org.apache.nifi.registry.security.authentication.exception.InvalidCredentialsException;
import org.apache.nifi.registry.security.exception.SecurityProviderCreationException;
import org.apache.nifi.registry.security.exception.SecurityProviderDestructionException;
import org.apache.nifi.registry.util.FormatUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Abstract DB based implementation of a login identity provider.
 */
public class SyncfusionProvider extends BasicAuthIdentityProvider implements IdentityProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(SyncfusionProvider.class);
    
    private  static final String issuer = SyncfusionProvider.class.getSimpleName();;
    private long expiration;
    private String umpPropertyFile;
    
    private final String providerFileStr="providerFile";
    private final String codeStr = "code";
    private final String syncusionAdmin ="Syncfusion";
      @Override
  public void onConfigured(IdentityProviderConfigurationContext configurationContext) throws SecurityProviderCreationException {

         final String rawExpiration = configurationContext.getProperty("Authentication Expiration");
        if (StringUtils.isBlank(rawExpiration)) {
            throw new SecurityProviderCreationException("The Authentication Expiration must be specified.");
        }
        try {
            expiration = FormatUtils.getTimeDuration(rawExpiration, TimeUnit.MILLISECONDS);
        } catch (final IllegalArgumentException iae) {
            throw new SecurityProviderCreationException(String.format("The Expiration Duration '%s' is not a valid time duration", rawExpiration));
        }
        
        umpPropertyFile = configurationContext.getProperty("Provider File");
        
        if(umpPropertyFile == null || umpPropertyFile.isEmpty()) {
            throw new SecurityProviderCreationException("Provider file path not configured");
        }
    }

    @Override
        public AuthenticationResponse authenticate(AuthenticationRequest authenticationRequest) throws InvalidCredentialsException, IdentityAccessException {
            String username = authenticationRequest.getUsername();
            final Object credentials = authenticationRequest.getCredentials();
            final String password = credentials != null && credentials instanceof String ? (String) credentials : null;
        switch (username) {
            case providerFileStr:
                return new AuthenticationResponse(providerFileStr, umpPropertyFile, expiration, issuer);
            case syncusionAdmin:
                return new AuthenticationResponse(username, username, expiration, issuer);
            case codeStr:
                try {
                    username = new JwtParsing().getUsername(password);
                    if(StringUtils.isBlank(username))
                        throw new IllegalArgumentException("Empty login identity found");
                } catch (IllegalArgumentException | IOException ex) {
                    throw new InvalidCredentialsException("Unable to parse response string " + ex);
                }
                return new AuthenticationResponse(username, username, expiration, issuer);
            default:
                throw new InvalidCredentialsException("Unable to authentication from Syncfusion provider");
        }
    }

    @Override
    public void preDestruction() throws SecurityProviderDestructionException {

    }

  
 
    
}
