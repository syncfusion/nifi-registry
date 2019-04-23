/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var $ = require('jquery');
var ngCore = require('@angular/core');
var ngMaterial = require('@angular/material');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');
var ngRouter = require('@angular/router');
var ngCommonHttp = require('@angular/common/http');


/**
 * NfRegistryHttpsLogout constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param matDialog             The angular material dialog module.
 */ 
function NfRegistryHttpsLogout(nfRegistryService, matDialog, nfRegistryApi, http, router,nfRegistryUMSLogout) {
    // Services
    this.nfRegistryService = nfRegistryService;
    this.dialog = matDialog;
    this.nfRegistryApi = nfRegistryApi;
    this.http = http;
    this.router = router;
    this.nfRegistryUMSLogout = nfRegistryUMSLogout;
};

NfRegistryHttpsLogout.prototype = {
    constructor: NfRegistryHttpsLogout,

    /**
     * Initialize the component
     */
    ngOnInit: function () {
       $("#nifi-registry-toolbar").css("display","none");
       $("#nf-registry-app-container").css("background-color","#2d3138");
    },
    httpsLogin: function () {
         window.location='/dataintegration-registry/login';
    }
};

NfRegistryHttpsLogout.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-https-logout.html!text'),
        animations: [nfRegistryAnimations.slideInLeftAnimation]
    })
];

NfRegistryHttpsLogout.parameters = [
    NfRegistryService,
    ngMaterial.MatDialog,
    NfRegistryApi,
    ngCommonHttp.HttpClient,
    ngRouter.Router,
    nfRegistryAuthGuardService.NfRegistryUMSLogout
];

module.exports = NfRegistryHttpsLogout;