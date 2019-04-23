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
var fdsDialogsModule = require('@fluid-design-system/dialogs');
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
function checkSyncfusionStatus() {
    var status = false;
    $.ajax({
        type: 'GET',
        url: '/nifi-registry-api/syncfusion/status',
        async: false
    }).done(function (response) {
        if (response.accessStatus.status === "TRUE") {
            localStorage.setItem("syncfusionUMSStatus", true);
            localStorage.setItem("accessStatusKey", response.accessStatus.key);
            localStorage.setItem("accessStatusValue", response.accessStatus.value);
        } else {
            localStorage.setItem("syncfusionUMSStatus", false);
        }
        return status;
    }).fail(function (error) {
        return error;
    });
}
$(document).ready(function () {
    checkSyncfusionStatus();
});
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
                        self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer');
                    } else {
                        self.nfRegistryService.router.navigateByUrl(url);
                    }
                } else {
                    // navigate to the login page
                    self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/login');
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
                        self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer');
                    } else {
                        if (currentUser.resourcePermissions.buckets) {
                            self.nfRegistryService.router.navigateByUrl(url);
                        } else {
                            self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/administration/users');
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
 * @param nfRegistryService  The nfRegistryService module.
 * @param http
 * @param router             
 * @param nfRegistryApi                            
 * @param  window    
 * @param fdsDialogService                                                     
 * @constructor
 */
function NfRegistryLoginAuthGuard(nfRegistryService,http,router,nfRegistryApi,window,fdsDialogService) {
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.http = http;
    this.router = router;
    this.window = window;
    this.codeURL='';
    this.umsConfiguredUrl='';
    this.dialogService = fdsDialogService;
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
        var self = this;
        var currentUrl = url;
        if (window.location.protocol === "http:") {
            var localStorageStatus = localStorage.getItem(window.location.hostname + "-status");
            if (localStorageStatus !== "true") {
                $("#nifi-registry-toolbar").css("display", "none");
                $("#nf-registry-app-container").css("background-color","#F9F9F9");
                self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');
            } else {
                self.nfRegistryService.currentUser.canLogout = true;
                self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                self.nfRegistryService.currentUser.anonymous = false;
                self.nfRegistryService.currentUser = {
                    canLogout: true,
                    canActivateResourcesAuthGuard: true,
                    identity: "admin",
                    anonymous: false,
                    resourcePermissions: {
                        anyTopLevelResource: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        buckets: {
                            canRead: true,
                            canWrite: true,
                            canDelete: true
                        },
                        tenants: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        policies: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        proxy: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        }
                    }
                };
                self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer/grid-list');
            }

        } else {
            if (currentUrl.indexOf("code") > -1) {
                this.codeURL = url;
            }
            if (currentUrl.indexOf("client_id") > -1) {
                this.umsConfiguredUrl = url;
            }
            var status = localStorage.getItem("syncfusionUMSStatus");
            var accessStatusKey = localStorage.getItem("accessStatusKey");
            var accessStatusValue = localStorage.getItem("accessStatusValue");
            if (status !== "true") {
                return self.defaultLogin();
            } else {
                return self.enableSecurity(accessStatusKey, accessStatusValue);
            }
        }

    },
    defaultLogin: function () {
        var self = this;
        if (self.nfRegistryService.currentUser.anonymous) {
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
                    self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/login');
                }
            });
        });
        return false;
    },
    enableSecurity: function (accessStatusKey, accessStatusValue) {
        var self = this;
        var isCancelled = false;
        var code = getParameterByName('code', this.codeURL);
        if (code !== null && code !== "") {
            //api call
            //  var status = self.nfRegistryApi.syncfusionLogin(code);
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
                        self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/login');
                    }
                });
            });
        }
        if (accessStatusKey === 'startUp' && !isCancelled && (code === null || code === "")) {
            var startupUrl = accessStatusValue;
            var baseUrl = getBaseUrl(startupUrl);
            //api call
            self.nfRegistryApi.isUMPConfigured(baseUrl).subscribe(function (response) {
                var isUMSConfigured = response;
                if (isUMSConfigured === "true") {
                    var clientId = getParameterByName('client_id', self.umsConfiguredUrl);
                    var clientSecret = getParameterByName('client_secret', self.umsConfiguredUrl);
                    if (clientId !== null && clientSecret !== null && clientId !== "" && clientSecret !== "") {
                        self.nfRegistryApi.decrypt(clientSecret).subscribe(function (decryptClient) {
                            clientSecret = decryptClient;
                            self.nfRegistryApi.enableUMSUserAccess(baseUrl, clientId, clientSecret);
                            var admin = null;
                            self.nfRegistryApi.getAdminUser(baseUrl, clientId, clientSecret).subscribe(function (response) {
                                admin = response;
                                if (admin !== null && admin !== "")
                                {
                                    //api call
                                    self.nfRegistryApi.configureUMP(baseUrl, clientId, clientSecret, admin, true).subscribe(function (response) {
                                        if (response === "Success") {
                                            window.location.href = '/dataintegration-registry/login';
                                        } else
                                        {
                                            self.dialogService.openConfirm({
                                                title: 'Error',
                                                message: "An unexpected error has occurred. Please check the logs for additional details.",
                                                acceptButton: 'Ok',
                                                acceptButtonColor: 'fds-warn'
                                            });
                                        }

                                    });
                                    //  $(".loader").css("display","none");
                                } else
                                {
                                    self.dialogService.openConfirm({
                                        title: 'Error',
                                        message: "Can't able to retrieve admin user information from User Management Server",
                                        acceptButton: 'Ok',
                                        acceptButtonColor: 'fds-warn'
                                    });
                                    //   $(".loader").css("display","none"); end commentline */
                                }
                            });
                        });
                    } else {
                        self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/enable-security');
                    }
                } else if (isUMSConfigured === "false") {
                    self.nfRegistryApi.addDipDialog();
                }
            });
        }
        if (accessStatusKey === 'baseUrl' && !isCancelled && (code === null || code === "")) {
            var baseUrl = getBaseUrl(accessStatusKey);
            if (self.nfRegistryApi.isUMPConfigured(baseUrl) !== "error")
            {
                //   $(".loader").css("display","block");
                window.location.href = accessStatusValue;

            }
        }
        return false;
    }
    };

NfRegistryLoginAuthGuard.parameters = [
    NfRegistryService,
    ngCommonHttp.HttpClient,
    ngRouter.Router,
    NfRegistryApi,
   fdsDialogsModule.FdsDialogService
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
        
            if(window.location.protocol === "http:"){
             var localStorageStatus = localStorage.getItem(window.location.hostname+"-status");
             if( localStorageStatus !== "true"){
                $("#nifi-registry-toolbar").css("display","none");
                $("#nf-registry-app-container").css("background-color","#F9F9F9");
                self.nfRegistryService.loggedIn=false;
                self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');
             }
             else {
            self.nfRegistryService.currentUser.canLogout = true;
            self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
            self.nfRegistryService.currentUser.anonymous = false;
            self.nfRegistryService.loggedIn=true;
            self.nfRegistryService.currentUser = {
                    canLogout: true,
                    canActivateResourcesAuthGuard: true,
                    identity: "admin",
                    anonymous: false,
                    resourcePermissions: {
                        anyTopLevelResource: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        buckets: {
                            canRead: true,
                            canWrite: true,
                            canDelete: true
                        },
                        tenants: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        policies: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        },
                        proxy: {
                            canRead: false,
                            canWrite: false,
                            canDelete: false
                        }
                    }
                };
              self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer/grid-list');
        }
         }
      else{
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
                        self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/login');
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
        self.nfRegistryService.currentUser.anonymous = true;
        self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/enable-security');
        return false;
    }
};

NfEnableSecurity.parameters = [
    NfRegistryService
];

function NfRegistryWithoutUMSLogin(nfRegistryService) {
    this.nfRegistryService = nfRegistryService;
};

NfRegistryWithoutUMSLogin.prototype = {
    constructor: NfRegistryWithoutUMSLogin,

    canActivate: function (state) {
        var url = state.url;
        return true;
    }
};

NfRegistryWithoutUMSLogin.parameters = [
    NfRegistryService
];

module.exports = {
    NfRegistryUsersAdministrationAuthGuard: NfRegistryUsersAdministrationAuthGuard,
    NfRegistryWorkflowsAdministrationAuthGuard: NfRegistryWorkflowsAdministrationAuthGuard,
    NfRegistryLoginAuthGuard: NfRegistryLoginAuthGuard,
    NfRegistryResourcesAuthGuard: NfRegistryResourcesAuthGuard,
    NfEnableSecurity:NfEnableSecurity,
    NfRegistryWithoutUMSLogin: NfRegistryWithoutUMSLogin,
    NfRegistryUMSLogout: NfRegistryWithoutUMSLogin
};
