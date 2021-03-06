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
var ngCore = require('@angular/core');
var ngMaterial = require('@angular/material');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var NfUserLoginComponent = require('nifi-registry/components/login/dialogs/nf-registry-user-login.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngRouter = require('@angular/router');
var ngCommonHttp = require('@angular/common/http');
var NfEnableUserComponent = require('nifi-registry/components/login/dialogs/nf-enable-user-login.js');
/**
 * NfLoginComponent constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param matDialog             The angular material dialog module.
 */
function NfLoginComponent(nfRegistryService, matDialog, nfRegistryApi, http, router) {
    // Services
    this.nfRegistryService = nfRegistryService;
    this.dialog = matDialog;
    this.nfRegistryApi = nfRegistryApi;
    this.http = http;
    this.router = router;
}
;

NfLoginComponent.prototype = {
    constructor: NfLoginComponent,

    /**
     * Initialize the component
     */

    ngOnInit: function () {
        this.nfRegistryService.perspective = 'login';
  
        this.nfRegistryApi.checkStatus().subscribe(function (response) {
            var syncfusionStatus = response.accessStatus;
            if (!syncfusionStatus)
            {
                this.dialog.open(NfUserLoginComponent, {
                    disableClose: true
                });
            }
        });
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
    NfRegistryService,
    ngMaterial.MatDialog,
    NfRegistryApi,
    ngRouter.Router,
    ngCommonHttp.HttpClient
];

module.exports = NfLoginComponent;
