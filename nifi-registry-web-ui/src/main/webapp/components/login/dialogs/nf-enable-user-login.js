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

/**
 * NfEnableUserLogin constructor.
 *
 * @param nfRegistryApi                     The api service.
 * @param nfRegistryService                 The nf-registry.service module.
 * @param matDialogRef                      The angular material dialog ref.
 * @param nfRegistryLoginAuthGuard          The login auth guard.
 * @constructor
 */
function NfEnableUserLogin(nfRegistryApi, nfRegistryService, matDialogRef, nfRegistryLoginAuthGuard) {
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dialogRef = matDialogRef;
    this.nfRegistryLoginAuthGuard = nfRegistryLoginAuthGuard;
};

NfEnableUserLogin.prototype = {
    constructor: NfEnableUserLogin,

 ngOnInit: function () {
     var self = this;
     this.nfRegistryApi.openEnableSecurityConfigDialog().subscribe(function (response) {
     var jsonData = $.parseJSON(response);
     self.nfRegistryService.applicationUrl = ("https://" + jsonData.applicationHostName + ":" + jsonData.applicationPortNo);
        }); 
 },
    BackToUrl: function()
    {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = false;
	self.nfRegistryService.enableApplicationUrl = true;
    },
    BackToDetails: function()
    {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = true;
	self.nfRegistryService.enableApplicationUrl = false;
    },
    NavigateToApplicationDetails: function()
    {
        var self = this;
        var baseUrl ='';
        self.nfRegistryService.umsBaseUrl ='';
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
    NavigateToApplicationUsers: function()
    {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = true; 
	self.nfRegistryService.enableApplicationDetails = false;
	self.nfRegistryService.enableApplicationUrl = false;
    },
    NavigateToApplicationUrl: function () {
        var self = this;
        self.nfRegistryService.enableApplicationUsers = false; 
	self.nfRegistryService.enableApplicationDetails = true;
	self.nfRegistryService.enableApplicationUrl = false;
        
       /* if(self.nfRegistryService.enableApplicationUrl === false &&
           self.nfRegistryService.enableApplicationDetails === false     )
        {
            //third dialog open
            self.nfRegistryService.enableApplicationUsers = true;
        }
        else if (self.nfRegistryService.enableApplicationUrl === false &&
               self.nfRegistryService.enableApplicationUsers === false)
        {
            //second dialog open
            self.nfRegistryService.enableApplicationDetails = true;  
        }
        else if(self.nfRegistryService.enableApplicationDetails === false &&
                 self.nfRegistryService.enableApplicationUsers  === false)
        {
            //first dialog open
            self.nfRegistryService.enableApplicationUrl = true;
        }
        self.nfRegistryService.enableApplicationUrl = false;
        self.nfRegistryService.enableApplicationDetails = true;
       /* var mj = username;
        username.value ="fsdff";
       this.nfRegistryApi.postToLogin(username.value).subscribe(function(response){
            if(response || response.status === 200) {
                //successful login
                self.dialogRef.close();
                self.nfRegistryService.currentUser.anonymous = false;
                self.nfRegistryLoginAuthGuard.checkLogin(self.nfRegistryService.redirectUrl);
            }
        });
        */
     //  $('#secondPage').css('display','block !important');
      // $('#firstPage').css('display','none');
    },
    getBaseUrl:function(url){
        var temp = url.split("/");
        return temp[0] + "//" + temp[2];
    },
    cancel:function()
    {
        this.dialogRef.close();
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
    nfRegistryAuthGuardService.NfRegistryLoginAuthGuard
];

module.exports = NfEnableUserLogin;