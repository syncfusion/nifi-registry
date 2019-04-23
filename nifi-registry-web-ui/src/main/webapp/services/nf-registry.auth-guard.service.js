/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngCommonHttp = require('@angular/common/http');
var ngRouter = require('@angular/router');
function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
        
    function getBaseUrl(url){
        var temp = url.split("/");
        return temp[0] + "//" + temp[2];
    }
/**
 * NfRegistryUsersAdministrationAuthGuard constructor.
 *
 * @param nfRegistryService                 The nfRegistryService module.
 * @constructor
 */
function NfRegistryUsersAdministrationAuthGuard(nfRegistryService) {
    this.nfRegistryService = nfRegistryService;
};

NfRegistryUsersAdministrationAuthGuard.prototype = {
    constructor: NfRegistryUsersAdministrationAuthGuard,

    /**
     * Can activate guard.
     * @returns {*}
     */
    canActivate: function (route, state) {
        var url = state.url;

        return this.checkLogin(url);
    },

    checkLogin: function (url) {
        var self = this;
        if (this.nfRegistryService.currentUser.resourcePermissions.tenants.canRead) { return true; }

        // Store the attempted URL for redirecting
        this.nfRegistryService.redirectUrl = url;

        // attempt kerberos authentication
        this.nfRegistryService.api.ticketExchange().subscribe(function (jwt) {
            self.nfRegistryService.api.loadCurrentUser().subscribe(function (currentUser) {
                self.nfRegistryService.currentUser = currentUser;
                if (currentUser.anonymous === false) {
                    // render the logout button if there is a token locally
                    if (self.nfRegistryService.nfStorage.getItem('jwt') !== null) {
                        self.nfRegistryService.currentUser.canLogout = true;
                    }

                    // redirect to explorer perspective if not admin
                    if (!currentUser.resourcePermissions.anyTopLevelResource.canRead) {
                        self.nfRegistryService.router.navigateByUrl('/nifi-registry/explorer');
                    } else {
                        self.nfRegistryService.router.navigateByUrl(url);
                    }
                } else {
                    // navigate to the login page
                    self.nfRegistryService.router.navigateByUrl('/nifi-registry/login');
                }
            });
        });

        return false;
    }
};

NfRegistryUsersAdministrationAuthGuard.parameters = [
    NfRegistryService
];

/**
 * NfRegistryWorkflowsAdministrationAuthGuard constructor.
 *
 * @param nfRegistryService                 The nfRegistryService module.
 * @constructor
 */
function NfRegistryWorkflowsAdministrationAuthGuard(nfRegistryService) {
    this.nfRegistryService = nfRegistryService;
};

NfRegistryWorkflowsAdministrationAuthGuard.prototype = {
    constructor: NfRegistryWorkflowsAdministrationAuthGuard,

    /**
     * Can activate guard.
     * @returns {*}
     */
    canActivate: function (route, state) {
        var url = state.url;

        return this.checkLogin(url);
    },

    checkLogin: function (url) {
        var self = this;
        if (this.nfRegistryService.currentUser.resourcePermissions.buckets.canRead || this.nfRegistryService.currentUser.anonymous) { return true; }

        // Store the attempted URL for redirecting
        this.nfRegistryService.redirectUrl = url;

        // attempt kerberos authentication
        this.nfRegistryService.api.ticketExchange().subscribe(function (jwt) {
            self.nfRegistryService.api.loadCurrentUser().subscribe(function (currentUser) {
                self.nfRegistryService.currentUser = currentUser;
                if (currentUser.anonymous === false) {
                    // render the logout button if there is a token locally
                    if (self.nfRegistryService.nfStorage.getItem('jwt') !== null) {
                        self.nfRegistryService.currentUser.canLogout = true;
                    }

                    // redirect to explorer perspective if not admin
                    if (!currentUser.resourcePermissions.anyTopLevelResource.canRead) {
                        self.nfRegistryService.router.navigateByUrl('/nifi-registry/explorer');
                    } else {
                        if (currentUser.resourcePermissions.buckets) {
                            self.nfRegistryService.router.navigateByUrl(url);
                        } else {
                            self.nfRegistryService.router.navigateByUrl('/nifi-registry/administration/users');
                        }
                    }
                } else {
                    // Navigate to the login page
                    self.nfRegistryService.router.navigateByUrl(url);
                }
            });
        });

        return false;
    }
};

NfRegistryWorkflowsAdministrationAuthGuard.parameters = [
    NfRegistryService
];

/**
 * NfRegistryLoginAuthGuard constructor.
 *
 * @param nfRegistryService                 The nfRegistryService module.
 * @constructor
 */
function NfRegistryLoginAuthGuard(nfRegistryService,http,router,nfRegistryApi,window
) {
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.http = http;
    this.router = router;
    this.window = window;
};

NfRegistryLoginAuthGuard.prototype = {
    constructor: NfRegistryLoginAuthGuard,

    /**
     * Can activate guard.
     * @returns {*}
     */
    canActivate: function (route, state) {
        var url = state.url;

        return this.checkLogin(url);
    },

    checkLogin: function (url) {
        alert(url);
        var self = this;
        var currentUrl = url;
        var umsConfiguredUrl;
        var codeUrl;
        if (currentUrl.indexOf("code") > -1) {
            codeUrl = url;
        }
        if (currentUrl.indexOf("client_id") > -1) {
            alert(url);
            umsConfiguredUrl = url;
        }
        this.nfRegistryApi.checkStatus().subscribe(function (response) {
            var isSyncfusionProviderEnabled = false;
            var isCancelled = false;
            var syncfusionStatus = response.accessStatus;
            if (syncfusionStatus.status === 'TRUE') {
                isSyncfusionProviderEnabled = true;
                var code = getParameterByName('code', codeUrl);
                if (code !== null && code !== "") {
                    //api call
                      var status =   self.nfRegistryApi.syncfusionLogin(code);
                    if (self.nfRegistryService.currentUser.anonymous) {
                        return true;
                    }
                    self.nfRegistryApi.syncfusionTicketExchange(code).subscribe(function (jwt) {
                        self.nfRegistryService.api.loadCurrentUser().subscribe(function (currentUser) {
                            self.nfRegistryService.currentUser = currentUser;
                            if (currentUser.anonymous === false) {
                                // render the logout button if there is a token locally
                                if (self.nfRegistryService.nfStorage.getItem('jwt') !== null) {
                                    self.nfRegistryService.currentUser.canLogout = true;
                                }
                                self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                                self.nfRegistryService.router.navigateByUrl(self.nfRegistryService.redirectUrl);
                            } else {
                                self.nfRegistryService.currentUser.anonymous = true;
                                self.nfRegistryService.router.navigateByUrl('/nifi-registry/login');
                            }
                        });
                    });
                }
                if (syncfusionStatus.key === 'startUp' && !isCancelled && (code === null || code === "")) {
                    var startupUrl = syncfusionStatus.value;
                    //  var returnUrl=getParameterByName('app_url',startupUrl);
                    var baseUrl = getBaseUrl(startupUrl);
                    //api call
                    
                    self.nfRegistryApi.isUMPConfigured(baseUrl).subscribe(function (response) {
                     var isUMSConfigured = response;
                    if (isUMSConfigured === "true") {
                        var clientId = getParameterByName('client_id',umsConfiguredUrl);
                        var clientSecret = getParameterByName('client_secret',umsConfiguredUrl);
                        alert(clientId);
                        if (clientId !== null && clientSecret !== null && clientId !== "" && clientSecret !== "") {                    
                          self.nfRegistryApi.decrypt(clientSecret).subscribe(function(decryptClient){
                           clientSecret = decryptClient;
                           //  clientSecret = decrypt(clientSecret);
                            //api call
                            self.nfRegistryApi.enableUMSUserAccess(baseUrl, clientId, clientSecret);
                            var admin = null ;
                            self.nfRegistryApi.getAdminUser(baseUrl, clientId, clientSecret).subscribe(function(response){
                            admin = response;
                            if (admin !== null && admin !== "")
                            {
                                //api call
                                            self.nfRegistryApi.configureUMP(baseUrl, clientId, clientSecret, admin, true).subscribe(function (response) {
                                                if (response === "Success") {
                                                    window.location.href = '/nifi-registry/login';
                                                } else
                                                {
                                                    window.location.href = '/nifi-registry/login';
                                                    alert(response);
                                                }
                                                
                                            });
                                //  $(".loader").css("display","none");
                            } else
                            {
                                alert("admin null");
                                
                                /* nfDialog.showOkDialog({
                                 headerText: "Error",
                                 dialogContent: "Can't able to retrieve admin user information from User Management Server"
                                 });
                                 //   $(".loader").css("display","none"); end commentline */
                            }
                        });
                    });
                        } else {
                            alert("client Id Null");
                            self.nfRegistryService.router.navigateByUrl('nifi-registry/login/enable-security');
                       //   return false;
                           // self.nfRegistryService.router.navigateByUrl('/nifi-registry/login/');
                           // return false;
                         //  nfRegistryAuthGuardService.NfEnableSecurity;
                        //   self.nfRegistryApi.enableSecurity();
                              
                           //  self.nfRegistryService.router.navigateByUrl('nifi-registry/ums-enable-security');
                            // $(".loader").css("display","none");
                            //api call     
                            //nf.EnableSecurityConfiguration.openEnableSecurityDialog(baseUrl);
                        }
                    } else if (isUMSConfigured === "false") {
                        alert('ums false');
                        window.location.href = startupUrl;
                        //self.nfRegistryService.router.navigateByUrl(startupUrl);
                    }
                });
                }
                if (syncfusionStatus.key === 'baseUrl' && !isCancelled && (code === null || code === "")) {
                    var baseUrl = getBaseUrl(syncfusionStatus.value);
                    if (self.nfRegistryApi.isUMPConfigured(baseUrl) !== "error")
                    {
                        //   $(".loader").css("display","block");
                        //  window.location = syncfusionStatus.value;
                        window.location.href = syncfusionStatus.value;
                        //self.router.navigateByUrl(syncfusionStatus.value);
                    }
                }

            } else if (!isSyncfusionProviderEnabled)
            {
                if (this.nfRegistryService.currentUser.anonymous) {
                    return true;
                }
                // attempt kerberos authentication
                this.nfRegistryService.api.ticketExchange().subscribe(function (jwt) {
                    self.nfRegistryService.api.loadCurrentUser().subscribe(function (currentUser) {
                        self.nfRegistryService.currentUser = currentUser;
                        if (currentUser.anonymous === false) {
                            // render the logout button if there is a token locally
                            if (self.nfRegistryService.nfStorage.getItem('jwt') !== null) {
                                self.nfRegistryService.currentUser.canLogout = true;
                            }
                            self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                            self.nfRegistryService.router.navigateByUrl(self.nfRegistryService.redirectUrl);
                        } else {
                            self.nfRegistryService.currentUser.anonymous = true;
                            self.nfRegistryService.router.navigateByUrl('/nifi-registry/login');
                        }
                    });
                });
         }
      });
        return false;
    }
};

NfRegistryLoginAuthGuard.parameters = [
    NfRegistryService,
    ngCommonHttp.HttpClient,
    ngRouter.Router,
    NfRegistryApi
];

/**
 * NfRegistryResourcesAuthGuard constructor.
 *
 * @param nfRegistryService                 The nfRegistryService module.
 * @constructor
 */
function NfRegistryResourcesAuthGuard(nfRegistryService) {
    this.nfRegistryService = nfRegistryService;
};

NfRegistryResourcesAuthGuard.prototype = {
    constructor: NfRegistryResourcesAuthGuard,

    /**
     * Can activate guard.
     * @returns {*}
     */
    canActivate: function (route, state) {
        var url = state.url;

        return this.checkLogin(url);
    },

    checkLogin: function (url) {
        var self = this;
        if (this.nfRegistryService.currentUser.canActivateResourcesAuthGuard === true) { return true; }

        // Store the attempted URL for redirecting
        this.nfRegistryService.redirectUrl = url;

        // attempt kerberos authentication
        this.nfRegistryService.api.ticketExchange().subscribe(function (jwt) {
            self.nfRegistryService.api.loadCurrentUser().subscribe(function (currentUser) {
                self.nfRegistryService.currentUser = currentUser;
                if (!currentUser || currentUser.anonymous === false) {
                    if(self.nfRegistryService.nfStorage.hasItem('jwt')){
                        self.nfRegistryService.currentUser.canLogout = true;
                        self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                        self.nfRegistryService.router.navigateByUrl(url);
                    } else {
                        self.nfRegistryService.router.navigateByUrl('/nifi-registry/login');
                    }
                } else if (currentUser.anonymous === true) {
                    // render the logout button if there is a token locally
                    if (self.nfRegistryService.nfStorage.getItem('jwt') !== null) {
                        self.nfRegistryService.currentUser.canLogout = true;
                    }
                    self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                    self.nfRegistryService.router.navigateByUrl(url);
                }
            });
        });

        return false;
    }
};

NfRegistryResourcesAuthGuard.parameters = [
    NfRegistryService
];


function NfEnableSecurity(nfRegistryService) {
    this.nfRegistryService = nfRegistryService;
};

NfEnableSecurity.prototype = {
    constructor: NfEnableSecurity,

    canActivate: function (state) {
        var url = state.url;

        return this.checkLogin(url);
    },

    checkLogin: function (url) {
        var self = this;
        if (this.nfRegistryService.currentUser.anonymous) {
            return true;
        }
        alert("grt:");
        self.nfRegistryService.currentUser.anonymous = true;
        self.nfRegistryService.router.navigateByUrl('nifi-registry/login/enable-security');
        return false;
    }
};

NfEnableSecurity.parameters = [
    NfRegistryService
];

module.exports = {
    NfRegistryUsersAdministrationAuthGuard: NfRegistryUsersAdministrationAuthGuard,
    NfRegistryWorkflowsAdministrationAuthGuard: NfRegistryWorkflowsAdministrationAuthGuard,
    NfRegistryLoginAuthGuard: NfRegistryLoginAuthGuard,
    NfRegistryResourcesAuthGuard: NfRegistryResourcesAuthGuard,
    NfEnableSecurity:NfEnableSecurity
};
