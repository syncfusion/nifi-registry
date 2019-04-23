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
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');

/**
 * NfLoginComponent constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param matDialog             The angular material dialog module.
 */
function NfLoginComponent(nfRegistryApi,nfRegistryService, matDialog,nfRegistryLoginAuthGuard) {
    // Services
    this.nfRegistryApi = nfRegistryApi;
    this.nfRegistryService = nfRegistryService;
    this.dialog = matDialog;
    this.nfRegistryLoginAuthGuard = nfRegistryLoginAuthGuard;
};

NfLoginComponent.prototype = {
    constructor: NfLoginComponent,

    /**
     * Initialize the component
     */
    ngOnInit: function () {
        this.nfRegistryService.perspective = 'login';
        $("#nifi-registry-toolbar").css("display","none");
        $("#nf-registry-app-container").css("background-color","#F9F9F9");
    },
    login: function (username, password) {
        var self = this;
        if ($('#login-username').val().trim() === "" || $('#login-password').val().trim() === "") {
            $("#password-error-validation").css("display", "none");
            $("#empty-error-validation").css("display", "block");
        } else {
           this.nfRegistryApi.postToLogin(username.value, password.value).subscribe(function(response){
               if(response || response.status === 200) {
                //self.dialogRef.close();
                 $("#nifi-registry-toolbar").css("display","block");
                 $("#nf-registry-app-container").css("background-color","#333842");
                self.nfRegistryService.currentUser.anonymous = false;
                self.nfRegistryLoginAuthGuard.checkLogin(self.nfRegistryService.redirectUrl);
                }
            });
        }
    }
};



NfLoginComponent.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-login.html!text'),
        animations: [nfRegistryAnimations.slideInLeftAnimation],
        host: {
            '[@routeAnimation]': 'routeAnimation'
        }
    })
];

NfLoginComponent.parameters = [
    NfRegistryApi,
    NfRegistryService,
    ngMaterial.MatDialog,
    nfRegistryAuthGuardService.NfRegistryLoginAuthGuard
];

module.exports = NfLoginComponent;
