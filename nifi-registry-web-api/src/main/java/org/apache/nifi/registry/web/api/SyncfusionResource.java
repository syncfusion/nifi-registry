/*
* To change this license header, choose License Headers in Project Properties.
* To change this template file, choose Tools | Templates
* and open the template in the editor.
*/
package org.apache.nifi.registry.web.api;

import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;
import com.wordnik.swagger.annotations.ApiResponse;
import com.wordnik.swagger.annotations.ApiResponses;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.fasterxml.jackson.databind.type.TypeFactory;
import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import javax.ws.rs.FormParam;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;
import org.apache.nifi.registry.web.syncfusionutilities.QueryStringCasingHelper;
import org.apache.nifi.registry.web.syncfusionutilities.AgentUtilities;
import org.apache.nifi.registry.web.syncfusionutilities.SyncfusionConstants;
import org.apache.nifi.registry.web.syncfusionutilities.TokenDetails;
import org.apache.nifi.registry.web.syncfusionutilities.UMSApplication;
import org.apache.nifi.registry.web.syncfusionutilities.TripleDESCipher;
import org.apache.nifi.registry.web.syncfusionutilities.UMPClient;
import org.apache.nifi.registry.web.syncfusionutilities.UMSCipher;
import org.apache.nifi.registry.web.syncfusionutilities.UserResponseData;
import org.apache.nifi.registry.web.api.dto.SyncfusionStatusDTO;
import org.apache.nifi.registry.web.api.entity.SyncfusionStatusEntity;
import io.jsonwebtoken.JwtException;
import java.io.UnsupportedEncodingException;
import org.apache.nifi.registry.exception.AdministrationException;
import org.apache.nifi.registry.properties.NiFiRegistryProperties;
import org.apache.nifi.registry.security.authentication.AuthenticationRequest;
import org.apache.nifi.registry.security.authentication.AuthenticationResponse;
import org.apache.nifi.registry.security.authentication.IdentityProvider;
import org.apache.nifi.registry.security.authentication.IdentityProviderUsage;
import org.apache.nifi.registry.security.authentication.exception.IdentityAccessException;
import org.apache.nifi.registry.security.authentication.exception.InvalidCredentialsException;
import org.apache.nifi.registry.web.exception.UnauthorizedException;
import org.apache.nifi.registry.web.security.authentication.jwt.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.stream.Collectors;
import javax.ws.rs.WebApplicationException;
import org.apache.nifi.registry.authorization.CurrentUser;
import org.apache.nifi.registry.authorization.ResourcePermissions;
import org.apache.nifi.registry.authorization.Tenant;
import org.apache.nifi.registry.authorization.User;
import org.apache.nifi.registry.security.authentication.UsernamePasswordAuthenticationRequest;
import org.apache.nifi.registry.security.authorization.user.NiFiUser;
import org.apache.nifi.registry.security.authorization.user.NiFiUserUtils;
import org.apache.nifi.registry.service.AuthorizationService;
import org.apache.nifi.registry.web.security.authentication.kerberos.KerberosSpnegoIdentityProvider;
import org.apache.nifi.registry.web.security.authentication.x509.X509IdentityProvider;
import org.apache.oltu.oauth2.client.OAuthClient;
import org.apache.oltu.oauth2.client.URLConnectionClient;
import org.apache.oltu.oauth2.client.request.OAuthClientRequest;
import org.apache.oltu.oauth2.client.response.OAuthAccessTokenResponse;
import org.apache.oltu.oauth2.common.exception.OAuthProblemException;
import org.apache.oltu.oauth2.common.exception.OAuthSystemException;
import org.apache.oltu.oauth2.common.message.types.GrantType;
import org.apache.oltu.oauth2.common.message.types.ResponseType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.apache.nifi.registry.bucket.UmsData;
import org.apache.nifi.registry.web.api.entity.Entity;
import java.io.IOException;
import org.apache.nifi.registry.web.api.TenantResource;

@Component
@Path("/syncfusion")
@Api(
        value = "/syncfusion",
        description = "Endpoints for obtaining an access token or checking access status."
)
public class SyncfusionResource extends ApplicationResource {
  
    private static final Logger logger = LoggerFactory.getLogger(SyncfusionResource.class);
    
    private final String syncfusionProvider = "syncfusion-provider";
    private final String authorizeEndPoint = "/oauth/v1/authorize";
    private final String tokenEndPoint = "/oauth/token";
    private final String returnUrlEndPoint = "/dataintegration-registry/login";
    private final String logoutEndPoint = "/dataintegration-registry/logout";
    private final String startUpStr = "startUp";
    private final String baseUrlStr = "baseUrl";
    private final String clientIdStr = "clientId";
    private final String clientSecretStr = "clientSecret";
    private final String logoutStr = "logout";
    private final String providerFileStr="providerFile";
    private final String umpBaseUrlProperty="syncfusion.ump.server.base.address";
    private final String umpClientIdProperty="syncfusion.dip.client.id";
    private final String umpClientSecretProperty="syncfusion.dip.client.secret";
    private NiFiRegistryProperties properties;
    private IdentityProvider identityProvider;
    private JwtService jwtService;
    private AuthorizationService authorizationService;
    private X509IdentityProvider x509IdentityProvider;
    private KerberosSpnegoIdentityProvider kerberosSpnegoIdentityProvider;
    List < String > defaultReportingTaskList = new ArrayList < > ();
    List < String > existingReportingTask = new ArrayList < > ();
    List < String > createdReprotingTaskId = new ArrayList();
    private TenantResource tenantResource;

    Connection con = null;
    Statement stmt = null;
    PreparedStatement statement = null;
    @Autowired
    public SyncfusionResource(
            NiFiRegistryProperties properties,
            AuthorizationService authorizationService,
            JwtService jwtService,
            TenantResource tenantResource,
            X509IdentityProvider x509IdentityProvider,
            @Nullable KerberosSpnegoIdentityProvider kerberosSpnegoIdentityProvider,
            @Nullable IdentityProvider identityProvider) {
        this.properties = properties;
        this.tenantResource=tenantResource;
        this.jwtService = jwtService;
        this.x509IdentityProvider = x509IdentityProvider;
        this.kerberosSpnegoIdentityProvider = kerberosSpnegoIdentityProvider;
        this.identityProvider = identityProvider;
        this.authorizationService = authorizationService;     
        
    }
    /**
     * Gets the status whether syncfusion provider enabled or not
     *
     * @param request the servlet request
     * @return A accessStatusEntity
     * @throws java.lang.Exception
     */
    @GET
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/status")
    @ApiOperation(
            value = "Gets the status the client's access",
            notes = NON_GUARANTEED_ENDPOINT,
            response = SyncfusionStatusEntity.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 401, message = "Unable to determine syncfusion provider status because the client could not be authenticated."),
                @ApiResponse(code = 403, message = "Unable to determine syncfusion provider status because the client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to determine syncfusion provider status because NiFi is not in the appropriate state."),
                @ApiResponse(code = 500, message = "Unable to determine syncfusion provider status because an unexpected error occurred.")
            }
    )
    public Response getEnabledStatus(@Context HttpServletRequest request) throws Exception {
        
        
        final SyncfusionStatusDTO syncfusionStatus = new SyncfusionStatusDTO();
        if(properties.getProperty(NiFiRegistryProperties.SECURITY_IDENTITY_PROVIDER) != null &&
                syncfusionProvider.equals(properties.getProperty(NiFiRegistryProperties.SECURITY_IDENTITY_PROVIDER))) {
            syncfusionStatus.setStatus(SyncfusionStatusDTO.Status.TRUE.name());
            syncfusionStatus.setMessage("Syncfusion Provider Enabled");
            
            if (identityProvider == null) {
                throw new IllegalStateException("Unable to get status whether Syncfusion provider enabled or not.");
            }
            String umpPropertiesFilePath=identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr,"")).getUsername();
            Properties umpProperties=loadPropertiesFromUMPProviderFile(umpPropertiesFilePath);
            
            String umsBaseUrl=getUMPPropertyValue(baseUrlStr,umpProperties);
            String clientId=getUMPPropertyValue(clientIdStr,umpProperties);
            String clientSecret=getUMPPropertyValue(clientSecretStr,umpProperties);
            
            String returnUrl = request.getScheme() + "://" + request.getHeader("Host");
            
            if(clientId==null||clientSecret==null||"".equals(clientId)||"".equals(clientSecret)){
                String registerUrls = returnUrl;
                String dipUrl = getDIPUrl(request.getServerName()).replaceAll("\"", "");
                if(!dipUrl.equals("")) {
                    registerUrls += "," + dipUrl;
                }
                syncfusionStatus.setKey(startUpStr);
                syncfusionStatus.setValue(trimUrl(umsBaseUrl)+"/en-us/startup?app_name=Syncfusion Data Integration&app_url="+trimUrl(registerUrls)+"&app_configure=true&app_type=data-integration-platform&callback="+trimUrl(returnUrl)+returnUrlEndPoint);
            }
            else {
                syncfusionStatus.setKey(baseUrlStr);
                syncfusionStatus.setValue(
                        getAuthorizeUrl(getUMPPropertyValue(baseUrlStr, umpProperties), returnUrl + returnUrlEndPoint, getUMPPropertyValue(clientIdStr, umpProperties)));
            }
        }
        else {
            syncfusionStatus.setStatus(SyncfusionStatusDTO.Status.FALSE.name());
            syncfusionStatus.setMessage("Syncfusion Provider Not Enabled");
        }
        final SyncfusionStatusEntity entity = new SyncfusionStatusEntity();
        entity.setAccessStatus(syncfusionStatus);
        

        return generateOkResponse(entity).build();
    }
  
       /**
     * Gets the current client's identity and authorized permissions.
     *
     * @param httpServletRequest the servlet request
     * @return An object describing the current client identity, as determined by the server, and it's permissions.
     */
    @GET
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/access")
    @io.swagger.annotations.ApiOperation(
            value = "Returns the current client's authenticated identity and permissions to top-level resources",
            response = CurrentUser.class
    )
    @io.swagger.annotations.ApiResponses({
        @io.swagger.annotations.ApiResponse(code = 409, message = HttpStatusMessages.MESSAGE_409 + " The NiFi Registry might be running unsecured.")})
    public Response getAccessStatus(@Context HttpServletRequest httpServletRequest) {

        final NiFiUser user = NiFiUserUtils.getNiFiUser();
        if (user == null) {
            // Not expected to happen unless the nifi registry server has been seriously misconfigured.
            throw new WebApplicationException(new Throwable("Unable to access details for current user."));
        }

        final CurrentUser currentUser = authorizationService.getCurrentUser();

        return generateOkResponse(currentUser).build();
    }
 
    /**
     *
     * @param request
     * @return
     * @throws Exception
     */
    @GET
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getumslogouturl")
    @ApiOperation(
            value = "Get UMS logout Url",
            notes = NON_GUARANTEED_ENDPOINT,
            response = SyncfusionStatusEntity.class,
            authorizations = {}
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 401, message = "Unable to determine syncfusion provider status because the client could not be authenticated."),
                @ApiResponse(code = 403, message = "Unable to determine syncfusion provider status because the client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to determine syncfusion provider status because NiFi is not in the appropriate state."),
                @ApiResponse(code = 500, message = "Unable to determine syncfusion provider status because an unexpected error occurred.")
            }
    )
    public Response getUmsLogoutUrl(
            @Context HttpServletRequest request) throws Exception {
        final SyncfusionStatusDTO syncfusionStatus = new SyncfusionStatusDTO();
        
        String umpPropertiesFilePath = identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr, "")).getUsername();
        Properties umpProperties=loadPropertiesFromUMPProviderFile(umpPropertiesFilePath);
        
        String umsBaseUrl=getUMPPropertyValue(baseUrlStr,umpProperties);
        String clientId=getUMPPropertyValue(clientIdStr,umpProperties);
        String redirectUri = request.getScheme() + "://" + request.getHeader("Host");
        
        syncfusionStatus.setKey(logoutStr);
        syncfusionStatus.setValue(trimUrl(umsBaseUrl)+"/oauth/logout?client_id=" + clientId + "&redirect_uri=" + trimUrl(redirectUri) + logoutEndPoint);
        
        final SyncfusionStatusEntity entity = new SyncfusionStatusEntity();
        entity.setAccessStatus(syncfusionStatus);
        
        return generateOkResponse(entity).build();
    }
    
    /**
     * Creates a token for accessing the REST API via username/password.
     *
     * @param httpServletRequest the servlet request
     * @param code
     * @return A JWT (string)
     */
    @POST
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/token")
    @ApiOperation(
            value = "Creates a token for accessing the REST API via username/password",
            notes = "The token returned is formatted as a JSON Web Token (JWT). The token is base64 encoded and comprised of three parts. The header, " +
                    "the body, and the signature. The expiration of the token is a contained within the body. The token can be used in the Authorization header " +
                    "in the format 'Authorization: Bearer <token>'.",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 403, message = "Client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to create access token because NiFi is not in the appropriate state. (i.e. may not be configured to support username/password login."),
                @ApiResponse(code = 500, message = "Unable to create access token because an unexpected error occurred.")
            }
    )
    public Response createAccessToken(
            @Context HttpServletRequest httpServletRequest,
            String code)  {
        
        String codeStr = "code";
        
        // only support access tokens when communicating over HTTPS
        if (!httpServletRequest.isSecure()) {
            throw new IllegalStateException("Access tokens are only issued over HTTPS.");
        }
        
        // if not configuration for login, don't consider credentials
        if (identityProvider == null) {
            throw new IllegalStateException("Username/Password login not supported by this NiFi.");
        }
        
        if(code == null) {
            throw new IllegalArgumentException("Invalid access token");
        }
        
                final String token;
        try {
            
        String umpPropertiesFilePath = identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr, "")).getUsername();
        Properties umpProperties = loadPropertiesFromUMPProviderFile(umpPropertiesFilePath);
        
        // attempt to authenticate
        String returnUrl = httpServletRequest.getScheme() + "://" + httpServletRequest.getHeader("Host")
                + returnUrlEndPoint;
        String responseString = getResponseString(getUMPPropertyValue(baseUrlStr, umpProperties), returnUrl, getUMPPropertyValue(clientIdStr, umpProperties),
                getUMPPropertyValue(clientSecretStr, umpProperties), code);
        
        AuthenticationRequest authenticationRequest = new UsernamePasswordAuthenticationRequest(codeStr, responseString);
        
            token = createAccessToken(identityProvider, authenticationRequest);
        } 
        
        catch (final InvalidCredentialsException | OAuthSystemException | OAuthProblemException ex){
            throw new UnauthorizedException("The supplied client credentials are not valid.", ex)
                    .withAuthenticateChallenge(IdentityProviderUsage.AuthType.OTHER);
        }
        
        // form the response
        final URI uri = URI.create(generateResourceUri("access", "token"));
        return generateCreatedResponse(uri, token).build();
    }
   
    private String createAccessToken(IdentityProvider identityProvider, AuthenticationRequest authenticationRequest)
            throws InvalidCredentialsException, AdministrationException {
        
        final AuthenticationResponse authenticationResponse;
        
        try {
            authenticationResponse = identityProvider.authenticate(authenticationRequest);
            final String token = jwtService.generateSignedToken(authenticationResponse);
            return token;
        } catch (final IdentityAccessException | JwtException e) {
            throw new AdministrationException(e.getMessage());
        }
        
    }
    
    /**
     *
     * @param request
     * @param baseUrl
     * @param applicationId
     * @param applicationSecret
     * @param username
     * @return
     * @throws java.net.MalformedURLException
     */
    @POST
//    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
//   @Produces(MediaType.APPLICATION_JSON)
    @Path("/get-ums-apps")
    @ApiOperation(
            value = "Get the syncfusion UMS application details through client ID,client secret and UMP base URL",
            notes = "returns the application details of corresponding user",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 403, message = "Client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to get UMS application deatils because NiFi is not in the appropriate state."),
                @ApiResponse(code = 500, message = "Unable to get UMS application details because an unexpected error occurred.")
            }
    )
    public Response getUMSApplicationDetails(@Context HttpServletRequest request,
             String username) throws MalformedURLException, IOException {
        StringBuilder response = new StringBuilder();
        String umpPropertiesFilePath = identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr, ""))
                .getUsername();
        Properties umpProperties = loadPropertiesFromUMPProviderFile(umpPropertiesFilePath);
        String baseUrl = getUMPPropertyValue(baseUrlStr,umpProperties);
        String applicationId = getUMPPropertyValue(clientIdStr,umpProperties);
        String applicationSecret = getUMPPropertyValue(clientSecretStr,umpProperties);
        String urlStr = trimUrl(baseUrl) + "/api/v1.0/users/" + username + "/apps";
        //String urlStr = trimUrl(baseUrl) + "/v1.0/users/" + username + "/apps"; //only for development purpose
        URL url = new URL(urlStr);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Authorization", "Bearer " + getAccessToken(baseUrl, applicationId, applicationSecret));
        connection.connect();
        try (BufferedReader readData = new BufferedReader(
                new InputStreamReader(connection.getInputStream()))) {
            String line;
            while ((line = readData.readLine()) != null) {
                response.append(line);
            }
        }
        ObjectMapper mapper = new ObjectMapper();
        TypeFactory typeFactory = mapper.getTypeFactory();
        CollectionType collectionType = typeFactory.constructCollectionType(ArrayList.class, UMSApplication.class);
        List<UMSApplication> applications = mapper.readValue(response.toString(), collectionType);
        applications.add(0, getUMS());
        return generateOkResponse(applications).build();
    }
    
    
    
    /**
     * Gets the users details from UMP server
     *
     * 
     * @param baseUrl
     * @param applicationId
     * @param applicationSecret
     * @return A accessStatusEntity
     * @throws java.lang.Exception
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getumpusers")
    @ApiOperation(
            value = "Get the syncfusion UMS user account details through client ID,client secret and UMP base URL",
            notes = "The user account details returned is formatted as a JSON . The response is base64 encoded and comprised of two parts. The key, "
                    + "and the value. The UMS user details is a contained within the body. The user details will be used to "
                    + "configure secure proeprties and restart the service.",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 403, message = "Client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to get UMS user deatils because NiFi is not in the appropriate state."),
                @ApiResponse(code = 500, message = "Unable to get UMS user details because an unexpected error occurred.")
            }
    )
    public Response getUMPUserDetails(@Context HttpServletRequest request,
            UmsData umsdata) throws Exception {        
        final SyncfusionStatusDTO syncfusionStatus = new SyncfusionStatusDTO();
        
        List<String> usernames = getUsernames(umsdata.getBaseUrl(),umsdata.getClientId(),umsdata.getClientSecret());
        
        syncfusionStatus.setKey("users");
        syncfusionStatus.setValue(usernames.stream()
                .collect(Collectors.joining(",")));
        syncfusionStatus.setMessage("Syncfusion UMS user account list");
        
        final SyncfusionStatusEntity entity = new SyncfusionStatusEntity();
        entity.setAccessStatus(syncfusionStatus);
        
        return generateOkResponse(entity).build();
    }
        
    /**
     * Decrypt the client secret key
     *
     * @param request
     * @param hostname
     * @param httpServletRequest the servlet request
     * @param clientSecret
     * @return A JWT (string)
     */
    @POST
    @Path("/decryptclientsecret")
    @ApiOperation(
            value = "Decrypts the client secret key for UMS",
            notes = "Used to get the user details",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 403, message = "Client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to decrypt client secret key because NiFi is not in the appropriate state. (i.e. may not be configured to support username/password login."),
                @ApiResponse(code = 500, message = "Unable to decrypt client secret key because an unexpected error occurred.")
            }
    )
    public String decryptClientSecret(
            @Context HttpServletRequest httpServletRequest,String clientSecret) {
        try {
            return new UMSCipher().decrypt(new QueryStringCasingHelper().DecodeCasing(clientSecret, '-'));
            
        }
        catch(Exception ex){
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }
    
    /**
     * Configure the ump
     *
     * @param request
     * @param hostname
     * @param baseUrl
     * @param clientId
     * @param clientSecret
     * @param isSecured
     * @param admin
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/configureump")
    @ApiOperation(
            value = "update UMP configuration",
            notes = "Used to update ump configuration files",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
                @ApiResponse(code = 403, message = "Client is not authorized to make this request."),
                @ApiResponse(code = 409, message = "Unable to decrypt client secret key because NiFi is not in the appropriate state. (i.e. may not be configured to support username/password login."),
                @ApiResponse(code = 500, message = "Unable to decrypt client secret key because an unexpected error occurred.")
            }
    )
    public String configureUMP(
            @Context HttpServletRequest request,
            UmsData umsdata
) throws Exception {        
        ObjectMapper mapper=new ObjectMapper();
        UMPClient umpClient=new UMPClient();
        umpClient.UMPBaseUrl=umsdata.getBaseUrl();
        umpClient.ClientId=umsdata.getClientId();
        umpClient.ClientSecret=new TripleDESCipher().encrypt(umsdata.getClientSecret());
        umpClient.Admin=umsdata.getAdmin();
        umpClient.PackageType ="Registry";
        String jsonData=mapper.writeValueAsString(umpClient);
        String hostname = umsdata.getHostname();
        String url = (umsdata.getIsSecured())?"http://" + hostname + ":" + SyncfusionConstants.DataIntegrationAgentPortNo + SyncfusionConstants.UpdataRegistryUMPConfigurationAPI + "?isRestart=false&canSecureDIP=false":
                "http://" + hostname + ":" + SyncfusionConstants.DataIntegrationAgentPortNo + SyncfusionConstants.EnableRegistrySecurityAPI;
        String response=new AgentUtilities().getPostResponse(url, jsonData, "application/json; charset=UTF-8");
        return response.replaceAll("^\"|\"$", "");
    }
    
    /**
     *
     * @param request
     * @param baseUrl
     * @return
     * @throws MalformedURLException
     * @throws IOException
     */
    @POST
  //  @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
  //  @Produces(MediaType.TEXT_PLAIN)
    @Path("/isumpconfigured")
    @ApiOperation(
            value = "whether ump configured",
            notes = "Used to check whether ump is configured or not",
            response = String.class
    )
    @ApiResponses(
            value = {
                    @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification.")                    
            }
    )
    public String isUMPConfigured(
            @Context HttpServletRequest request,
             String baseUrl) throws MalformedURLException, IOException {
        int status;
        try {
            URL url = new URL(trimUrl(baseUrl)+SyncfusionConstants.IsUMSConfiguredAPI);
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestMethod("GET");
            conn.connect();
            status = conn.getResponseCode();
        }
        catch (Exception ex) {
            throw new IllegalStateException("Unable to contact User Management Server. Make sure User Management server running properly.");
        }
        switch (status) {
            case 200:
                return "true";
            case 417:
                return "false";
            default:
                throw new IllegalStateException("Unable to contact User Management Server. Please restart User Management Server or contact Syncfusion support.");
        }
    }
    
    /**
     * Configure the ump
     * @param request
     * @param hostname
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     * @throws javax.crypto.BadPaddingException
     */
    @POST
    @Path("/getnifidetails")
    @ApiOperation(
            value = "update UMP configuration",
            notes = "Used to update ump configuration files",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
            }
    )
    public String getnifidetails(
            @Context HttpServletRequest request, String hostname) throws Exception {
        String nifiDetailsUrl = "http://" + hostname + ":" + SyncfusionConstants.DataIntegrationAgentPortNo + SyncfusionConstants.getRegistryDetails;
        return new AgentUtilities().getResponse(nifiDetailsUrl);
    }
    
       /**
     * Configure the ump
     * @param request
     * @param hostname
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     * @throws javax.crypto.BadPaddingException
     */
    @POST
    @Path("/getDipUrl")
    @ApiOperation(
            value = "update UMP configuration",
            notes = "Used to update ump configuration files",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
            }
    )
    public String getDipUrl(
            @Context HttpServletRequest request, String hostname) throws Exception {
        return getDIPUrl(hostname);
    }
    
    /**
     * Configure the ump
     * @param request
     * @param umsdata
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/enable-ums-user-access")
    @ApiOperation(
            value = "enable ums user access",
            notes = "Used to enable UMS user access",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
            }
    )
    public String EnableUMSUserAccess(@Context HttpServletRequest request,
           UmsData umsdata) throws IOException {
        StringBuilder response=new StringBuilder();
        String token = getAccessToken(umsdata.getBaseUrl(),umsdata.getClientId(),umsdata.getClientSecret());
        
        URL url = new URL(trimUrl(umsdata.getBaseUrl()) + "/api/v1.0/apps/"+umsdata.getClientId());
        //URL url = new URL(trimUrl(baseUrl) + "/v1.0/apps/"+applicationId); //only for development purposes
        
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        Map<String, String> params = new HashMap<>();
        params.put("HasAccessToAllUsers", "true");
        
        StringBuilder parameters = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            parameters.append(URLEncoder.encode(entry.getKey(), "UTF-8")).append("=").append(URLEncoder.encode(entry.getValue(), "UTF-8")).append("&");
        }
        byte[] data = parameters.toString().getBytes();
        connection.setFixedLengthStreamingMode(data.length);
        connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        connection.setRequestMethod("PUT");
        connection.setRequestProperty("Authorization", "Bearer " + token);
        connection.setDoOutput(true);
        connection.connect();
        BufferedReader readData;
        try (OutputStream writeData = connection.getOutputStream()) {
            writeData.write(data);
            writeData.flush();
            readData = new BufferedReader(
                    new InputStreamReader(connection.getInputStream()));
            String line;
            while ((line = readData.readLine()) != null) {
                response.append(line);
            }
        }
        readData.close();
        return SyncfusionConstants.Success;
    }
    /**
     * Gets the status whether syncfusion provider enabled or not
     *
     * @param request the servlet request
     * @return String.
     * @throws java.lang.Exception
     */
   @GET
//    @Consumes(MediaType.WILDCARD)
//    @Produces(MediaType.APPLICATION_JSON)
    @Path("importumsusers")
    @ApiOperation(
            value = "import users",
            response = String.class
    )
    @ApiResponses({
            @ApiResponse(code = 400, message = HttpStatusMessages.MESSAGE_400),
            @ApiResponse(code = 409, message = HttpStatusMessages.MESSAGE_409 + " The NiFi Registry may not be configured to support login with customized credentials."),
            @ApiResponse(code = 500, message = HttpStatusMessages.MESSAGE_500) })  
    public Response importUmsUsers(@Context HttpServletRequest request) throws Exception {
          List<String> createUserList;
        try {
           final List<String> registryUsers = authorizationService.getUsers().stream()
                    .map(u -> u.getIdentity())
                    .collect(Collectors.toList());    
            String umpPropertiesFilePath = identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr, "")).getUsername();
            Properties umpProperties=loadPropertiesFromUMPProviderFile(umpPropertiesFilePath); 
            String umsBaseUrl = getUMPPropertyValue(baseUrlStr,umpProperties);
            String clientId = getUMPPropertyValue(clientIdStr,umpProperties);
            String clientSecret = getUMPPropertyValue(clientSecretStr,umpProperties);
            
            List<String> umsUsers = getUsernames(umsBaseUrl, clientId, clientSecret);
            createUserList = umsUsers.stream().filter(u -> !registryUsers.contains(u)).collect(Collectors.toList());
        }
        catch( IdentityAccessException | IOException ex) {
            logger.error(ex.getMessage(), ex);
            throw new IllegalStateException("Unable to import users from User Management Server");
        }
          return generateOkResponse(createUserList).build();
    }
    
    /**
     * Configure the ump
     * @param httpServletRequest
     * @param userName
     * @param password
     * @param operationType
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/manage-credential")
    @ApiOperation(
            value = "Manage user credentials details",
            notes = "It performs authentication to Data Integration URL by using given username and password. "
                    + "Also it performs resetting password operation.",
            response = String.class
    )
    @ApiResponses(
            value = {
                @ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),
            }
    )
    public String manageCredential(@Context HttpServletRequest httpServletRequest, UmsData umsdata) throws Exception{
        String response = "Authentication failure";
        try {
            String dbLocation = "conf/dataintegrationDB.db",
                    tableName = "login",
                    connectionUrl = "jdbc:sqlite:"+dbLocation;
            Class.forName("org.sqlite.JDBC");
            //StringEncryptor nifiEncryptor = StringEncryptor.createEncryptor(properties);
            String encryptedPassword = new UMSCipher().encrypt(umsdata.getPassword());
            con = DriverManager.getConnection(connectionUrl);
            stmt = con.createStatement();
            if (umsdata.getOperationaltype().equals("changePassword")) {
                String emailId = "sample.mail@gmail.com";
                String query = "update "+tableName+" set password='" + encryptedPassword + "',emailid='" + emailId + "' where username='" + umsdata.getUsername() + "'";
                stmt.executeUpdate(query);
                response = "Success";
            } else {
                String query = "select * from "+ tableName +" where username='" + umsdata.getUsername() + "'";
                ResultSet result = stmt.executeQuery(query);
                if (result.next())
                    if (umsdata.getPassword().equals(new UMSCipher().decrypt(result.getString("password"))))
                        response = "Success";
            }
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            throw new IllegalStateException("Exception occurred while authenticate credential. "
                    + "Please check log for more details.");
        }finally {
                dispose();
        }
        return response;
    }
    
    /**
     * Close the connection and its related properties
     */
    private void dispose() {
        try {
            if (stmt != null) {
                stmt.close();
            }
            if (con != null) {
                con.close();
            }
            if (statement != null) {
                statement.close();
            }
        } catch (Exception ex) {
            java.util.logging.Logger.getLogger(SyncfusionResource.class.getName()).log(Level.SEVERE, null, ex);
        }
    }  
    private String getResponseString(String baseUrl, String returnUrl, String clientId, String clientSecret,
            String accessCode) throws OAuthSystemException, OAuthProblemException {
        OAuthClientRequest request = OAuthClientRequest
                .tokenLocation(trimUrl(baseUrl) + tokenEndPoint)
                .setGrantType(GrantType.AUTHORIZATION_CODE)
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRedirectURI(returnUrl)
                .setCode(accessCode)
                .buildBodyMessage();
        
        OAuthClient oAuthClient = new OAuthClient(new URLConnectionClient());
        OAuthAccessTokenResponse oAuthResponse = oAuthClient.accessToken(request);
        return oAuthResponse.getAccessToken();
    }
    
    private String getDIPUrl(String hostname) {
        try {
            String agentUrl = "http://" + hostname + ":" + SyncfusionConstants.DataIntegrationAgentPortNo + SyncfusionConstants.getDIPURL;
            return new AgentUtilities().getResponse(agentUrl);
        } catch (Exception ex) {
            return "";
        }
    }
    
    private String getAuthorizeUrl(String baseUrl, String returnUrl, String clientId) throws Exception {
        OAuthClientRequest oauthRequest = OAuthClientRequest
                .authorizationLocation(trimUrl(baseUrl) + authorizeEndPoint)
                .setClientId(clientId)
                .setRedirectURI(returnUrl)
                .setResponseType(ResponseType.CODE.toString())
                .setScope("ums:profile")
                .buildQueryMessage();
        return oauthRequest.getLocationUri();
    }
    
    private String trimUrl(String url) {
        if(url.endsWith("/")) {
            url = url.substring(0, url.length()-1);
        }
        return url;
    }
    
    private long validateTokenExpiration(long proposedTokenExpiration, String identity) {
        final long maxExpiration = TimeUnit.MILLISECONDS.convert(12, TimeUnit.HOURS);
        final long minExpiration = TimeUnit.MILLISECONDS.convert(1, TimeUnit.MINUTES);
        
        if (proposedTokenExpiration > maxExpiration) {
            logger.warn(String.format("Max token expiration exceeded. Setting expiration to %s from %s for %s", maxExpiration,
                    proposedTokenExpiration, identity));
            proposedTokenExpiration = maxExpiration;
        } else if (proposedTokenExpiration < minExpiration) {
            logger.warn(String.format("Min token expiration not met. Setting expiration to %s from %s for %s", minExpiration,
                    proposedTokenExpiration, identity));
            proposedTokenExpiration = minExpiration;
        }
        
        return proposedTokenExpiration;
    }
    
    private Properties loadPropertiesFromUMPProviderFile(String path){
        try {
            File umpPropertiesFile=new File(path);
            if(umpPropertiesFile.exists()){
                Properties umpProperties = new Properties();
                try (FileInputStream inputStream = new FileInputStream(umpPropertiesFile)) {
                    umpProperties.load(inputStream);
                }
                return umpProperties;
            }
            else
                throw new IllegalStateException("UMS properties file does not exist");
        } catch (IOException | IllegalStateException e) {
            throw new IllegalStateException(e);
        }
    }
    
    private String getUMPPropertyValue(String identity, Properties umpProperties){
        switch(identity){
            case baseUrlStr:
                return umpProperties.getProperty(umpBaseUrlProperty);
            case clientIdStr:
                return umpProperties.getProperty(umpClientIdProperty);
            case clientSecretStr:
                return umpProperties.getProperty(umpClientSecretProperty);
            default:
                throw new IllegalStateException("Invalid syncfusion provider property");
        }
    }
    
    private String getAccessToken(String baseUrl, String applicationId,
            String applicationSecret) throws MalformedURLException, IOException {
        StringBuilder response = new StringBuilder();
        
        URL url = new URL(trimUrl(baseUrl) + "/api/token");
        //URL url = new URL(trimUrl(baseUrl) + "/token"); //only for development purposes
        
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        Map<String, String> params = new HashMap<>();
        params.put("grant_type", "client_credentials");
        params.put("client_id", applicationId);
        params.put("client_secret", applicationSecret);
        
        StringBuilder parameters = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            parameters.append(URLEncoder.encode(entry.getKey(), "UTF-8")).append("=").append(URLEncoder.encode(entry.getValue(), "UTF-8")).append("&");
        }
        byte[] data = parameters.toString().getBytes();
        connection.setFixedLengthStreamingMode(data.length);
        connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.connect();
        BufferedReader readData;
        try (OutputStream writeData = connection.getOutputStream()) {
            writeData.write(data);
            writeData.flush();
            readData = new BufferedReader(
                    new InputStreamReader(connection.getInputStream()));
            String line;
            while ((line = readData.readLine()) != null) {
                response.append(line);
            }
        }
        readData.close();
        ObjectMapper mapper = new ObjectMapper();
        String accessToken = mapper.readValue(response.toString(), TokenDetails.class).Access_Token;
        return accessToken;
    }
    
    private UserResponseData getUserDetails(String baseUrl, String applicationId, String token,
            int page, int pageSize) throws MalformedURLException, IOException {
        StringBuilder response = new StringBuilder();
        String urlStr = trimUrl(baseUrl) + "/api/v1.0/apps/" + applicationId + "/users";
        //String urlStr = trimUrl(baseUrl) + "/v1.0/apps/" + applicationId + "/users"; //only for development purpose
        if(page != 0 && pageSize != 0) {
            urlStr += "?page=" + page + "&page_size=" + pageSize;
        }
        URL url = new URL(urlStr);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Authorization", "Bearer " + token);
        connection.connect();
        try (BufferedReader readData = new BufferedReader(
                new InputStreamReader(connection.getInputStream()))) {
            String line;
            while ((line = readData.readLine()) != null) {
                response.append(line);
            }
        }
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(response.toString(), UserResponseData.class);
    }
    
    private List<String> getUsernames(String baseUrl, String applicationId,
            String applicationSecret) throws IOException {
        String token = getAccessToken(baseUrl, applicationId, applicationSecret);
        List<String> users = new ArrayList<>();
        UserResponseData userData = getUserDetails(baseUrl, applicationId,
                token, 0, 0);
        users.addAll(userData.Data.stream().map(u -> u.Username).collect(Collectors.toList()));
        int pageSize = 25;
        int pages = (int) ((userData.TotalCount + pageSize - 1) / pageSize);
        for(int page=2; page<=pages; page++) {
            users.addAll(getUserDetails(baseUrl, applicationId,
                    token, page, pageSize).Data.stream().map(u -> u.Username).collect(Collectors.toList()));
        }
        return users;
    }
    
    private UMSApplication getUMS() {
        List<String> umsBaseUrlList = new ArrayList<>();
        String umpPropertiesFilePath = identityProvider.authenticate(new UsernamePasswordAuthenticationRequest(providerFileStr, ""))
                .getUsername();
        Properties umpProperties = loadPropertiesFromUMPProviderFile(umpPropertiesFilePath);
        String umsBaseUrl = getUMPPropertyValue(baseUrlStr,umpProperties).toLowerCase();
        umsBaseUrlList.add(umsBaseUrl);
        UMSApplication application=new UMSApplication();
        application.Name="Syncfusion User Management Server";
        application.Url=umsBaseUrlList;
        application.Type="UMS"; 
        application.Icon="/dataintegration-registry/images/UMS.png";
        return application;
    }
    
     /**
     * Get DIP version details
     * @param request
     * @param hostname
     * @return A JWT (string)
     * @throws java.io.UnsupportedEncodingException
     * @throws java.net.MalformedURLException
     * @throws javax.crypto.BadPaddingException
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/getdipdetails")
    @io.swagger.annotations.ApiOperation(
            value = "Get the dip current version",
            notes = "Used to update the about page",
            response = String.class
    )
    @io.swagger.annotations.ApiResponses(
            value = {
                    @io.swagger.annotations.ApiResponse(code = 400, message = "NiFi was unable to complete the request because it was invalid. The request should not be retried without modification."),      
            }
    )
    public String getDipVersion(
        @Context HttpServletRequest request,@FormParam("hostname") String hostname) throws Exception {
        String nifiDetailsUrl = "http://" + hostname + ":" + SyncfusionConstants.DataIntegrationAgentPortNo + SyncfusionConstants.GetDipVersion;
        return new AgentUtilities().getResponse(nifiDetailsUrl);
    }
}
