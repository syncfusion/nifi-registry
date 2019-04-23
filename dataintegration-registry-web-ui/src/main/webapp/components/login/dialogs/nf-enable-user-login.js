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
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngMaterial = require('@angular/material');
var nfRegistryAuthGuardService = require('nifi-registry/services/nf-registry.auth-guard.service.js');
var fdsDialogsModule = require('@fluid-design-system/dialogs');


/**
 * NfEnableUserLogin constructor.
 *
 * @param nfRegistryApi                     The api service.
 * @param nfRegistryService                 The nf-registry.service module.
 * @param matDialogRef                      The angular material dialog ref.
 * @param nfRegistryLoginAuthGuard          The login auth guard.
 * @constructor
 */
function NfEnableUserLogin(nfRegistryApi, nfRegistryService, matDialogRef, nfRegistryLoginAuthGuard,fdsDialogService) {
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dialogRef = matDialogRef;
    this.nfRegistryLoginAuthGuard = nfRegistryLoginAuthGuard;
    this.appicationBaseUrl ="";
    this.applicationClientId = "" ;
    this.applicationClientSceret="";    
    this.applicationLaunchUrl = "";
    this.selectedAdminUser = "";
    this.dialogService = fdsDialogService;
};

NfEnableUserLogin.prototype = {
    constructor: NfEnableUserLogin,

 ngOnInit: function () {
     var self = this;
     this.nfRegistryApi.openEnableSecurityConfigDialog().subscribe(function (response) {
     var jsonData = $.parseJSON(response);
     self.applicationLaunchUrl = ("https://" + jsonData.ApplicationHostName + ":" + jsonData.ApplicationPortNo);
     self.nfRegistryService.applicationUrl = ("https://" + jsonData.ApplicationHostName + ":" + jsonData.ApplicationPortNo);
        }); 
 },
    BackToUrl: function()
    {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = false;
	self.nfRegistryService.enableApplicationUrl = true;
        self.nfRegistryService.showErrorMessage = false;
    },
    BackToDetails: function()
    {
        var self = this;
        self.nfRegistryService.showErrorMessage = false;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = true;
	self.nfRegistryService.enableApplicationUrl = false;

    },
    NavigateToApplicationDetails: function()
    {
        var self = this;
        var baseUrl ='';
        self.nfRegistryService.umsBaseUrl ='';
        self.nfRegistryService.enableButtonStatus = true;
        self.nfRegistryService.showErrorMessage = false;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = true;
	self.nfRegistryService.enableApplicationUrl = false;
        //api call to get the UMS base url
        this.nfRegistryApi.checkStatus().subscribe(function (response) {
             var syncfusionStatus = response.accessStatus;
              if(syncfusionStatus.status === 'TRUE')
              {
                   var startupUrl = syncfusionStatus.value;
                   baseUrl = self.getBaseUrl(startupUrl);
                   self.nfRegistryService.umsBaseUrl = baseUrl;
              }
              });
        
    },
    NavigateToApplicationUsers: function(umsUrl,clientId,clientSecret)
    {
        var self = this;
        this.appicationBaseUrl = umsUrl.value;
        this.applicationClientId = clientId.value;
        this.applicationClientSceret = clientSecret.value;
        self.nfRegistryService.showErrorMessage = false;
        self.nfRegistryService.enablePanelSpinner = true;
        self.nfRegistryApi.umsUserEnable(umsUrl.value, clientId.value, clientSecret.value).subscribe(function (response) {
            if (response === "success")
            {
                self.nfRegistryService.usersList.length = 0;
                self.nfRegistryApi.getAdminUserList(umsUrl.value, clientId.value, clientSecret.value).subscribe(function (response) {
                    var responseData = response.accessStatus.value;
                    var userList = responseData.split(',');
                    var jsonArray = [];
                    for (var i = 0; i < userList.length; i++) {
                        var jsonObject = new Object();
                        jsonObject.text = userList[i];
                        jsonObject.value = userList[i];
                        jsonArray.push(jsonObject);
                        self.nfRegistryService.usersList.push(jsonObject);
                    }
                     self.nfRegistryService.enablePanelSpinner = false;
                });
                self.nfRegistryService.showErrorMessage = false;
                self.nfRegistryService.enableApplicationUsers = true;
                self.nfRegistryService.enableApplicationDetails = false;
                self.nfRegistryService.enableApplicationUrl = false;
            }
            else
            {
                self.nfRegistryService.enablePanelSpinner = false;
                self.nfRegistryService.showErrorMessage = true;
            }
            self.nfRegistryService.enableButtonStatus = true;
        });
    },
    NavigateToApplicationUrl: function () {
        var self = this;
        self.nfRegistryService.showErrorMessage = false;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = true;
	self.nfRegistryService.enableApplicationUrl = false;
    },
    NavigateToLoginPage:function(user)
    {
        this.selectedAdminUser = user.value.value;
        var self = this;
        self.nfRegistryService.selectedUserNextBtn = false;
    },
    UmsLogin : function()
    {
        var self = this;
        var baseUrl = this.appicationBaseUrl;
        var clientId = this.applicationClientId;
        var clientSecret = this.applicationClientSceret;
        var selectedAdmin  = this.selectedAdminUser ;
        var isRegistrySecured = self.nfRegistryApi.isRegistrySecured();
        if (isRegistrySecured)
        {
            self.nfRegistryApi.configureUMP(baseUrl, clientId, clientSecret, selectedAdmin, isRegistrySecured).subscribe(function (response) {
                if (response === "Success") {
                    window.location.href = '/dataintegration-registry/login';
                } else if (response === "Fail")
                {
                    self.dialogService.openConfirm({
                        title: 'Error',
                        message: "An unexpected error has occurred. Please check the logs for additional details.",
                        acceptButton: 'Ok',
                        acceptButtonColor: 'fds-warn'
                    }).afterClosed().subscribe(
                            function (accept) {
                                if (accept) {
                                    window.location.href = '/dataintegration-registry/login';
                                }
                            });
                }

            });
        } else {
            self.NavigateToApplicationLaunch();
            self.nfRegistryApi.launchConfigureUmp(baseUrl, clientId, clientSecret,
                    selectedAdmin, isRegistrySecured).subscribe(function (response) {
            });
        }

    },
    NavigateToApplicationLaunch : function()
    {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = false;
	self.nfRegistryService.enableApplicationUrl = false;
        self.nfRegistryService.enableLaunchPanel = true;  
        self.nfRegistryService.nextbtnThirdPanel = true;
        this.ngOnInit();
        
    },
    getBaseUrl:function(url){
        var temp = url.split("/");
        return temp[0] + "//" + temp[2];
    },
    cancel:function()
    {
        this.dialogRef.close();
        this.nfRegistryService.router.navigateByUrl('dataintegration-registry/');
    },
    SecureEnableUrl:function()
    {
        window.location.href =  this.applicationLaunchUrl;  
    },
    copyInputMessage:function(){
    jQuery.fn.selectText = function () {
                this.find('input').each(function () {
                    if ($(this).prev().length === 0 || !$(this).prev().hasClass('p_copy')) {
                        $('<p class="p_copy" style="position: absolute; z-index: -1;"></p>').insertBefore($(this));
                    }
                    $(this).prev().html($(this).val());
                });
                var doc = document;
                var element = this[0];
                if (doc.body.createTextRange) {
                    var range = document.body.createTextRange();
                    range.moveToElementText(element);
                    range.select();
                } else if (window.getSelection) {
                    var selection = window.getSelection();
                    var range = document.createRange();
                    range.selectNodeContents(element);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            };
            $("#register-link").selectText();
            document.execCommand("copy");
    
     var copyLinkSnackbar = document.getElementById("snackbar");
     copyLinkSnackbar.className = "show";
      setTimeout(function () {
         copyLinkSnackbar.className = copyLinkSnackbar.className.replace("show", "");
        }, 3000);
    },
    checkFieldEmpty:function(inputElement)
    {
        var self = this;
        if(inputElement === "")
        {
            self.nfRegistryService.enableButtonStatus = true;
        }
        else
        {
            self.nfRegistryService.enableButtonStatus = false;
        }
    }
};



NfEnableUserLogin.annotations = [
    new ngCore.Component({
        template: require('./nf-enable-user-login.html!text')
    })
];

NfEnableUserLogin.parameters = [
    NfRegistryApi,
    NfRegistryService,
    ngMaterial.MatDialogRef,
    nfRegistryAuthGuardService.NfRegistryLoginAuthGuard,
   fdsDialogsModule.FdsDialogService
];

module.exports = NfEnableUserLogin;