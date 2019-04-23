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
var $ = require('jquery');
var ngCore = require('@angular/core');
var ngMaterial = require('@angular/material');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfUserLoginComponent = require('nifi-registry/components/login/dialogs/nf-registry-user-login.js');
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');

/**
 * NfLoginComponent constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param matDialog             The angular material dialog module.
 */
function NfHttpLoginComponent(nfRegistryApi,nfRegistryService, matDialog,nfRegistryLoginAuthGuard,nfRegistryWithoutUMSLogin) {
    // Services
    this.nfRegistryApi = nfRegistryApi;
    this.nfRegistryService = nfRegistryService;
    this.dialog = matDialog;
    this.nfRegistryLoginAuthGuard = nfRegistryLoginAuthGuard;
    this.nfRegistryWithoutUMSLogin = nfRegistryWithoutUMSLogin;
    
    $(document).ready(function () {
        $('#login-username, #login-password').on('keyup', function (e) {
             var username = $('#login-username').val();
             var password = $('#login-password').val();
             var type = "login";
                if (e.keyCode === 13) {
                if($('#login-username').val().trim() === "" || $('#login-password').val().trim() === ""){
                    $("#password-error-validation").css("display", "none");
                    $("#empty-error-validation").css("display", "block");
                } else {
                    nfRegistryApi.ValidateCredentials(username, password, type).subscribe(function (response) {
                        if (response === "Success") {
                            nfRegistryService.currentUser.anonymous = false;
                            nfRegistryService.currentUser.identity = "admin";
                            nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer/grid-list');
                            localStorage.setItem(window.location.hostname + "-status", true);
                            $("#nifi-registry-toolbar").css("display", "block");
                        } else {
                            $("#empty-error-validation").css("display", "none");
                            $("#password-error-validation").css("display", "block");
                            $("#password-error-validation").text("Please enter valid username and password.");
                        }
                    });
                }
            }
        });
    });
};

NfHttpLoginComponent.prototype = {
    constructor: NfHttpLoginComponent,

    /**
     * Initialize the component
     */
    ngOnInit: function () {
        var self = this;
        $("#nifi-registry-toolbar").css("display","none");
        $("#nf-registry-app-container").css("background-color","#F9F9F9");
          if(window.location.protocol === "http:"){
             var localStorageStatus = localStorage.getItem(window.location.hostname+"-status");
             if( localStorageStatus !== "true"){
                 $("#nifi-registry-toolbar").css("display","none");
                 $("#nf-registry-app-container").css("background-color","#F9F9F9");
                self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');
             }
             else{
                 self.nfRegistryService.currentUser.canLogout = true;
                 self.nfRegistryService.currentUser.canActivateResourcesAuthGuard = true;
                 self.nfRegistryService.currentUser.anonymous = false;
                 self.nfRegistryService.currentUser.identity = "admin";
                 self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer/grid-list');
                 $("#nifi-registry-toolbar").css("display","block");
                 localStorage.setItem(window.location.hostname + "-status", true);
             }
         }
        this.nfRegistryService.perspective = 'login';
    },
    login: function (username, password) {
        var self = this;
        var type = "login";
             if($('#login-username').val().trim() === "" || $('#login-password').val().trim() === ""){
                 $("#password-error-validation").css("display","none");
                 $("#empty-error-validation").css("display","block");
             }
        else {
        this.nfRegistryApi.ValidateCredentials(username.value, password.value,type).subscribe(function(response){
            if(response === "Success"){
                self.nfRegistryService.currentUser = {
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
                //self.nfRegistryLoginAuthGuard.checkLogin(self.nfRegistryService.redirectUrl);
                self.nfRegistryService.router.navigateByUrl('/dataintegration-registry/explorer/grid-list');
                localStorage.setItem(window.location.hostname + "-status", true);
                $("#nifi-registry-toolbar").css("display","block");
            }
            else{
                 $("#empty-error-validation").css("display","none");
                 $("#password-error-validation").css("display", "block");
                 $("#password-error-validation").text("Please enter valid username and password.");
            }
        });
    }
    }
};

NfHttpLoginComponent.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-http-login.html!text'),
        animations: [nfRegistryAnimations.slideInLeftAnimation],
        host: {
            '[@routeAnimation]': 'routeAnimation'
        }
    })
];

NfHttpLoginComponent.parameters = [
    NfRegistryApi,
    NfRegistryService,
    ngMaterial.MatDialog,
    nfRegistryAuthGuardService.NfRegistryLoginAuthGuard,
    nfRegistryAuthGuardService.NfRegistryWithoutUMSLogin 
];

module.exports = NfHttpLoginComponent;
