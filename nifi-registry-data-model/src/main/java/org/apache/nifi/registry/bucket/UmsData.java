/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.apache.nifi.registry.bucket;

import io.swagger.annotations.ApiModel;
@ApiModel("umsData")
public class UmsData {
    
   public UmsData() {}
   
   private String baseUrl;  
   
   private String clientId;
   
   private String clientSecret;
   
   private String admin;
   
   private Boolean isSecured;
   
   private String hostname;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getOperationaltype() {
        return operationaltype;
    }

    public void setOperationaltype(String operationaltype) {
        this.operationaltype = operationaltype;
    }


   
   private String username;
   private String password;
   private String operationaltype;
   
    public Boolean getIsSecured() {
        return isSecured;
    }

    public void setIsSecured(Boolean isSecured) {
        this.isSecured = isSecured;
    }
   


    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getAdmin() {
        return admin;
    }

    public void setAdmin(String admin) {
        this.admin = admin;
    }


    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
   
}
