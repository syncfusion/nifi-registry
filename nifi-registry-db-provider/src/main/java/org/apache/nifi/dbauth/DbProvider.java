
package org.apache.nifi.dbauth;

import java.sql.SQLException;
import java.util.concurrent.TimeUnit;
import org.apache.commons.lang3.StringUtils;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DbProvider extends BasicAuthIdentityProvider implements IdentityProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(DbProvider.class);
    
    private static final String default_expiration = "12 hours";
    private  static final String issuer = DbProvider.class.getSimpleName();
    private long expiration;
    private SyncfusionAuthProvider provider;

    @Override
    public void preDestruction() throws SecurityProviderDestructionException {
    }

    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest authenticationRequest) throws InvalidCredentialsException, IdentityAccessException {
        if (provider == null) {
            throw new IdentityAccessException("DB authentication provider is not initialized.");
        }

            // perform the authentication
            final String username = authenticationRequest.getUsername();
            final Object credentials = authenticationRequest.getCredentials();
            final String password = credentials != null && credentials instanceof String ? (String) credentials : null;

            if(provider.isAuthenticatedUser(username, password)) {
                return new AuthenticationResponse(username, username, expiration, issuer);
            }
            else {
                throw new InvalidCredentialsException("Invalid username or password");
            }
    }

    @Override
    public void onConfigured(IdentityProviderConfigurationContext configurationContext) throws SecurityProviderCreationException {
        
        String rawExpiration = configurationContext.getProperty("Authentication Expiration");
        if (StringUtils.isBlank(rawExpiration)) {
            rawExpiration = default_expiration;
            logger.info("No Authentication Expiration specified, defaulting to " + default_expiration);
        }

        try {
            expiration = FormatUtils.getTimeDuration(rawExpiration, TimeUnit.MILLISECONDS);
        } catch (final IllegalArgumentException iae) {
            throw new SecurityProviderCreationException(
                    String.format("The Expiration Duration '%s' is not a valid time duration", rawExpiration));
        }
        
        String dbType = configurationContext.getProperty("Database Type");
        final String dbUrl = configurationContext.getProperty("Database Url");
        String username = configurationContext.getProperty("Database Username");
        String password = configurationContext.getProperty("Database Password");
        
        if(dbType == null || dbType.isEmpty()) {
            dbType = DbTypes.Sqlite.toString();
            logger.info("As database type is not specified in configuration, sqlite database is choosen");
        }
        if(dbUrl == null || dbUrl.isEmpty()) {
            throw new SecurityProviderCreationException("Database file path is not configured");
        }
        if((username != null && username.isEmpty()) || (password != null && password.isEmpty())) {
            username = null;
            password = null;
        }
        
        try {
            if(DbTypes.Sqlite.toString().equals(dbType.toLowerCase())) {
                provider = new SyncfusionAuthProvider(DbTypes.Sqlite, dbUrl, username, password);
            }
            else if(DbTypes.PostgreSQL.toString().equals(dbType.toLowerCase())) {
                provider = new SyncfusionAuthProvider(DbTypes.PostgreSQL, dbUrl, username, password);
            }
            else
                throw new SecurityProviderCreationException(dbType + " database not supported in this version.");
        } catch (SQLException | ClassNotFoundException ex) {
            logger.error(ex.getMessage());
            if (logger.isDebugEnabled()) {
                logger.debug(StringUtils.EMPTY, ex);
            }
            throw new SecurityProviderCreationException(ex.getMessage());
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            if (logger.isDebugEnabled()) {
                logger.debug(StringUtils.EMPTY, ex);
            }
            throw new SecurityProviderCreationException(ex.getMessage());
        }
        
    }
    
}
