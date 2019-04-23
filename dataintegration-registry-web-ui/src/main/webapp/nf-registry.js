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

/* global nf, nfRegistryApi, nfRegistry */
var $ = require('jquery');
var ngCore = require('@angular/core');
var rxjs = require('rxjs/Observable');
var ngCommonHttp = require('@angular/common/http');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngRouter = require('@angular/router');
var MILLIS_PER_SECOND = 1000;
var NfRegistryChangePassword = require('nifi-registry/components/login/dialogs/nf-change-password-dialog.js');
var ngMaterial = require('@angular/material');
var fdsDialogsModule = require('@fluid-design-system/dialogs');

/**
 * NfRegistry constructor.
 *
 * @param http                  The angular http module.
 * @param nfStorage             A wrapper for the browser's local storage.
 * @param nfRegistryService     The registry service.
 * @param nfRegistryApi     The api service.
 * @param changeDetectorRef     The change detector ref.
 * @param router                The angular router module.
 * @constructor
 */
function NfRegistry(http, nfStorage, nfRegistryService, nfRegistryApi, changeDetectorRef, router,matDialog,fdsDialogService) {
    this.http = http;
    this.nfStorage = nfStorage;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.cd = changeDetectorRef;
    this.router = router;
    this.selectedTab='';
    this.dialog = matDialog;
    this.checkStatus;
    this.dialogService = fdsDialogService;
    
    $(document).ready(function () {
        var regitsryAPI = nfRegistryApi;
        regitsryAPI.checkStatus().subscribe(function (response) {
            var syncfusionStatus = response.accessStatus;          
              if(syncfusionStatus.status === 'TRUE')
              {
                   nfRegistryService.umpEnabledStatus = true; 
              }
              else{
                  nfRegistryService.umpEnabledStatus = false; 
              }
        });  
    
        $(document).on("click", ".app-tile", function () {
            var targetAppTile = this;
            var regitsryAPI = nfRegistryApi;
            var registryService = nfRegistryService;
            var propertyValue = $(".url-tooltip").css("display");
            if (propertyValue === "block") {
                $(".url-tooltip").remove();
            }
            var applicationName = $(this).attr('data-appName');
            var currentUser= registryService.currentUser.identity;
            regitsryAPI.getUMSApplicationDetails(currentUser).subscribe(function (response) {
                var applications;
                var applicationsResponse = response;
                for (var i = 0; i < applicationsResponse.length; i++) {
                    if (applicationsResponse[i]["Name"] === applicationName)
                    {
                        applications = applicationsResponse[i];
                    }
                }
                var currentApplicationUrls = applications.Url;
                var applicationUrlsCount = applications.Url.length;
                if (applicationUrlsCount === 1) {
                    window.open(applications.Url, '_blank');
                    $("#ums-application-container").css('display', 'none');
                } else {
                    var urlTags = "";
                    for (var i = 0; i < currentApplicationUrls.length; i++) {
                        urlTags = urlTags + '<a href="' + currentApplicationUrls[i] + '" target="_blank" title="' + currentApplicationUrls[i] + '" class="popover-content" data-appUrl="' + currentApplicationUrls[i] + '">' + currentApplicationUrls[i] + '</a>';
                    }
                    $(targetAppTile).append('<div class="url-tooltip" style="display:none" id="urlPopup">' + urlTags + '</div>');
                    var popup = $(targetAppTile).find("#urlPopup")[0];
                    popup.classList.toggle("show");
                    $("#ums-application-container").css('display', 'block');
                }
            });
        });
    });
};

NfRegistry.prototype = {
    constructor: NfRegistry,

    /**
     * Initialize the component
     */
    ngOnInit: function () {
        var self = this;
        this.nfRegistryService.sidenav = this.sidenav; //ngCore.ViewChild
        if(window.location.pathname.indexOf("user")>-1){
         this.nfRegistryService.selectedTab ="users";  
        }
        else
        this.nfRegistryService.selectedTab ="buckets";
    },

//    /**
//     * Since the child views are updating the nfRegistryService values that are used to display
//     * the breadcrumbs in this component's view we need to manually detect changes at the correct
//     * point in the lifecycle.
//     */
//    ngAfterViewChecked: function () {
//        this.cd.detectChanges();
//    },

    /**
     * Invalidate old tokens and route to login page
     */
    logout: function() {
        var self = this;
        delete this.nfRegistryService.currentUser.identity;
        delete this.nfRegistryService.currentUser.anonymous;
        if(window.location.protocol === "http:") {
            localStorage.removeItem(window.location.hostname + "-status");
            $("#nifi-registry-toolbar").css("display","none");
            $("#nf-registry-app-container").css("background-color","#F9F9F9");
            this.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');
        }
        else{
             this.nfStorage.removeItem('jwt');
        self.nfRegistryApi.checkStatus().subscribe(function (response) {
            var syncfusionStatus = response.accessStatus;
            if (syncfusionStatus.status) {
                self.nfRegistryApi.getLogoutUmsUrl().subscribe(function (urlResponse) {
                    var urlStatus = urlResponse.accessStatus;
                    if (urlStatus.key === 'logout') {
                        window.location.href = urlStatus.value;
                    }
                });
            } else {
                this.router.navigateByUrl('/dataintegration-registry/login');
            }
        });
        }
        this.nfRegistryService.isLoggedOut=true;
    },
     /**
     * Navigates to admin perspective.
     *
     * @param $event
     */
      navigateToAdminPerspective: function($event) {
        if ($event.value.indexOf('users')>-1){
            this.router.navigateByUrl('dataintegration-registry/explorer/user');
            this.nfRegistryService.selectedTab ="users";  
        } else {
            this.router.navigateByUrl('dataintegration-registry/explorer/' + $event.value);
            this.nfRegistryService.selectedTab ="buckets";  
        }
    },
//    navigateToAdminPerspective: function() {
//        $(".f-button-grp").removeClass('active');
//        if (this.selectedTab.indexOf('users')>-1){
//            $("#users-tab").addClass('active');
//            this.router.navigateByUrl('dataintegration-registry/explorer/user');
//        } else {
//            this.router.navigateByUrl('dataintegration-registry/explorer/bucket');
//             $("#buckets-tab").addClass('active');
//        }
//    },
    UmsSwitcherMenu: function () {
        var applications;
        var propertyValue = $("#ums-application-container").css("display");
        if (propertyValue === "none") {
            $("#ums-application-container").empty();
            var newdiv = $('<div class="app-tile" ></div>');
            var currentUser= this.nfRegistryService.currentUser.identity;
            this.nfRegistryApi.getUMSApplicationDetails(currentUser).subscribe(function (response) {
                applications = response;
                for (var i = 0; i < applications.length; i++) {
                    newdiv = $('<div class="app-tile" href="' + applications[i]["Url"][0] + '" target="_blank" \n\
                        title="' + applications[i]["Name"] + '" data-appName="' + applications[i]["Name"] + '" data-appUrl="' + applications[i]["Url"][0] + '">\n\
                        <div class="app-tile-icon"><img class="application-image" src="' + applications[i]["Icon"] + '" style="width:36px;height:36px;"></div><div class="app-tile-caption">' + applications[i]["Name"] + '</div></div>');
                    $("#ums-application-container").append(newdiv);
                }
                $("#ums-application-container").css('display', 'block');
            });

        } else {
            $("#ums-application-container").css('display', 'none');
        }
    },
   
    /**
     * Generate the user tab tooltip.
     *
     * @returns {*}
     */
    getUserTooltip: function() {
        if(this.nfRegistryService.currentUser.anonymous) {
            return 'Please configure DataIntegration Registry security to enable.';
        }
        else {
            if(!this.nfRegistryService.currentUser.resourcePermissions.tenants.canRead) {
                return 'You do not have permission. Please contact your System Administrator.';
            } else {
                return 'Manage DataIntegration Registry users and groups.';
            }
        }
    },
    /**
     * Opens the change password dialog.
     */
    changePassword: function () {
        this.dialog.open(NfRegistryChangePassword, {
            disableClose: true,
            width: '400px'
        });
    }
};

NfRegistry.annotations = [
    new ngCore.Component({
        selector: 'nf-registry-app',
        template: require('./nf-registry.html!text'),
        queries: {
            sidenav: new ngCore.ViewChild('sidenav')
        },
        animations: [nfRegistryAnimations.flyInOutAnimation]
    })
];

NfRegistry.parameters = [
    ngCommonHttp.HttpClient,
    NfStorage,
    NfRegistryService,
    NfRegistryApi,
    ngCore.ChangeDetectorRef,
    ngRouter.Router,
    ngMaterial.MatDialog,
    fdsDialogsModule.FdsDialogService
];

module.exports = NfRegistry;
