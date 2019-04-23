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
/* global nfRegistryService, NfRegistryAddPolicyToBucket, nfRegistryApi, usersPolicies, groupPolicies, nfRegistryManageGroupPolicies, nfRegistryManageUserPolicies, self, NfRegistryAddUsersToGroup */
var $ = require('jquery');
var ngCore = require('@angular/core');
var rxjs = require('rxjs/Observable');
var ngCommonHttp = require('@angular/common/http');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngRouter = require('@angular/router');
var ngMaterial = require('@angular/material');
var covalentCore = require('@covalent/core');
var ngCore = require('@angular/core');
var rxjs = require('rxjs/Observable');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var nfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var ngRouter = require('@angular/router');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var ngMaterial = require('@angular/material');
var fdsDialogsModule = require('@fluid-design-system/dialogs');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
var NfRegistryAddUser = require('nifi-registry/components/administration/users/dialogs/add-user/nf-registry-add-user.js');
var NfRegistryCreateNewGroup = require('nifi-registry/components/administration/users/dialogs/create-new-group/nf-registry-create-new-group.js');
var NfRegistryAddUserToGroups = require('nifi-registry/components/administration/users/dialogs/add-user-to-groups/nf-registry-add-user-to-groups.js');

/**
 * NfRegistryUser constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param router                The angular router module.
 * @constructor
 */
function NfRegistryUser(nfRegistryApi, nfStorage, nfRegistryService,activatedRoute, fdsDialogService, matDialog,fdsSnackBarService,tdDataTableService,router) {
    
     // local state
    this.filteredUsers = [];
    this.filteredUserGroups = [];
    this.userGroupsSearchTerms = [];
    this.manageUserPerspective = 'membership';
     this.isUser = true;
     this.isGroup = false;
     this.isUserPolicy =  false;
     this.isGroupPolicy = false;
    this.isFilteredUserGroup = false;
    this.isFilteredRegistryGroup = false;
    // Services
    this.router = router;
    this.route = activatedRoute;
    this.nfStorage = nfStorage;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dataTableService = tdDataTableService;
    this.snackBarService = fdsSnackBarService;
    this.dialogService = fdsDialogService;
    this.dialog = matDialog;
    this.isEdited=false;
    this.enableEdit=true;
    this.usersSearchTerms = [];
    this.groups = [];
    this.users = [];
    this.selectedUser='';
    this.selectedGroup='';
    this.importedUsers=[];
    this.searchTerm;
    this.group = {
        resourcePermissions: {
            anyTopLevelResource: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            buckets: {
                canRead: false,
                canWrite: false,
                canDelete: false
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
};

NfRegistryUser.prototype = {
    constructor: NfRegistryUser,

    /**
     * Initialize the component.
     */
    ngOnInit: function () {
        var self = this;
         if(self.nfRegistryService.isLoggedIn() === false)
        {
           self.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');  
        }
        else{
        this.nfRegistryService.perspective = 'user';
        this.nfRegistryService.setBreadcrumbState('in');
        this.nfRegistryService.inProgress = true;
        this.$subscription = this.route.params
            .switchMap(function (params) {
                self.nfRegistryService.adminPerspective = 'users';
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getUsers(),
                    self.nfRegistryApi.getUserGroups()
                );
            })
            .subscribe(function (response) {
                var users = response[0];
                var groups = response[1];
                self.nfRegistryService.users = users;
                self.nfRegistryService.groups = groups;
                self.nfRegistryService.filterUsersAndGroups();
                self.nfRegistryService.inProgress = false;
                self.nfRegistryService.userGroupTab ="user";
                self.isUserPolicy = true;
                if(self.nfRegistryService._username === ""){
                self.selectedUser=users[0];
                self.nfRegistryService._username=users[0].identity;
                self.nfRegistryService.user = users[0];  
                self.userPolicies(users[0]);    
                }
                else{
                self.userPolicies(self.nfRegistryService.user); 
                }
                if(groups.length > 0 && self.nfRegistryService._groupname === ""){
                self.selectedGroup=groups[0];
                self.nfRegistryService.group = groups[0];  
                self.nfRegistryService._groupname = groups[0].identity;
                self.userGroupPolicies(groups[0]);
                } 
                else if(groups.length > 0){ 
                self.userGroupPolicies(self.nfRegistryService.group); 
                }
            });
        }
    },

    /**
     * Destroy the component.
     */
    ngOnDestroy: function () {
        this.nfRegistryService.adminPerspective = '';
        this.nfRegistryService.users = this.nfRegistryService.filteredUsers = [];
        this.nfRegistryService.groups = this.nfRegistryService.filteredUserGroups = [];
        this.nfRegistryService.allUsersAndGroupsSelected = false;
        this.$subscription.unsubscribe();
    },
     /**
     * Opens the create new bucket dialog.
     */
    addUser: function () {
        this.dialog.open(NfRegistryAddUser, {
            disableClose: true,
             width: '400px'
        });
    },
     /**
     * Opens the create new group dialog.
     */
    createNewGroup: function () {
        this.dialog.open(NfRegistryCreateNewGroup, {
            disableClose: true,
             width: '400px'
        });
    },
    allFilteredUsersSelected: function (selectedUser) {
        this.nfRegistryService._username = selectedUser.identity;
        this.selectedUser=selectedUser;
        this.nfRegistryService.filteredUsers.forEach(function (user) {
            if(selectedUser===user){
               user.checked=true; 
            }
            else if (user.checked) {
                user.checked=false;
            }
        });
    },
       allFilteredGroupsSelected: function (selectedGroup) {
        this.nfRegistryService._groupname = selectedGroup.identity;
        this.selectedGroup=selectedGroup;
        this.nfRegistryService.group = selectedGroup;
        this.nfRegistryService.filteredUserGroups.forEach(function (group) {
            if(selectedGroup === group){
               group.checked=true; 
            }
            else if (group.checked) {
                group.checked=false;
            }
        });
    },
       /**
     * Filter users
     *
     * @param $event SearchUsers
     */
    navigateToUserGroupPerspective: function($event) {
        if ($event.value.indexOf('user')>-1){
           $("#registry-groups-searchpanel").css("display","none");
           $("#registry-users-searchpanel").css("display","block");
           this.searchRegistryGroupsCloseBtn();
           this.isUser = true;
           this.isGroup = false;
           this.isUserPolicy = true;
           this.isGroupPolicy = false;
           this.userPolicies(this.selectedUser);
        } else {
           $("#registry-users-searchpanel").css("display","none");
           $("#registry-groups-searchpanel").css("display","block");
           this.searchUserCloseBtn();
           this.isUser = false;
           this.isGroup = true;
           this.manageGroupPerspective='membership';
           this.isGroupPolicy = true;
           this.isUserPolicy = false;
           this.userGroupPolicies(this.selectedGroup);
        }  
    },
    
           /**
     * Filter users
     *
     * @param $event
     */
    manageUserGroupPerspective: function(userOrGroup,tabSelection) {
         var self = this;
        if (tabSelection === 'isUser'){      
            if (userOrGroup !== "") {
            this.isUserPolicy = true;
            this.isGroupPolicy = false;
            self.userPolicies(userOrGroup);
            }
         
         } else { 
            if (userOrGroup !== "") {
            this.isUserPolicy = false;
            this.isGroupPolicy = true;
            self.userGroupPolicies(userOrGroup);
            }
        }
     },
    
         /**
     * Initialize the User policies component.
     */
    userGroupPolicies:function(selecteduserGroup){
    var self = this;
    if(selecteduserGroup!==""){
        // subscribe to the route params
        this.$subscription = self.route.params
            .switchMap(function (params) {
                return self.nfRegistryApi.getUserGroup(selecteduserGroup.identifier);
            })
            .subscribe(function (response) {
                self.nfRegistryService.group = response;
                self.nfRegistryService._groupname = response.identity;
                self.filterUsers();
              
            });
        }
    },
    
     userPolicies:function(selectedUser){
         if(this.selectedUser!==""){
                  var self = this;
        // subscribe to the route params
        this.$subscription = self.route.params
            .switchMap(function (params) {
                return self.nfRegistryApi.getUser(selectedUser.identifier);
            })
            .subscribe(function (response) {
                self.nfRegistryService.user = response;
                self.nfRegistryService._username = response.identity;
                self.filterGroups();
            });    
         }
    },
     /**
     * Filter users.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterUsers: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC'
        }
        // if `sortBy` is `undefined` then find the first sortable column in `userGroupsColumns`
        if (sortBy === undefined) {
            var arrayLength = this.nfRegistryService.userGroupsColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.nfRegistryService.userGroupsColumns[i].sortable === true) {
                    sortBy = this.nfRegistryService.userGroupsColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.nfRegistryService.userGroupsColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.nfRegistryService.userGroupsColumns[i].active = true;
                    this.nfRegistryService.userGroupsColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newUsersData = this.nfRegistryService.group.users || [];
        newUsersData = this.dataTableService.sortData(newUsersData, sortBy, sortOrder);
        this.filteredUsers = newUsersData;
    },
    
    /**
     * Filter groups.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterGroups: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC'
        }
        // if `sortBy` is `undefined` then find the first sortable column in `userGroupsColumns`
        if (sortBy === undefined) {
            var arrayLength = this.nfRegistryService.userGroupsColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.nfRegistryService.userGroupsColumns[i].sortable === true) {
                    sortBy = this.nfRegistryService.userGroupsColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.nfRegistryService.userGroupsColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.nfRegistryService.userGroupsColumns[i].active = true;
                    this.nfRegistryService.userGroupsColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newUserGroupsData = this.nfRegistryService.user.userGroups || [];

        newUserGroupsData = this.dataTableService.sortData(newUserGroupsData, sortBy, sortOrder);
        this.filteredUserGroups = newUserGroupsData;
//        if(newUserGroupsData.length>0)
//        this.selectedGroup=newUserGroupsData[0];
    },
    
    /**
     * Toggles the manage bucket privileges for the group.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleGroupManageBucketsPrivileges: function ($event, policyAction) {
        var self = this;
        if ($event.checked) {
            for (var resource in this.nfRegistryService.BUCKETS_PRIVS) {
                if (this.nfRegistryService.BUCKETS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.BUCKETS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, self.nfRegistryService.group.users, []).subscribe(
                                        function (response) {
                                            // can manage buckets privileges created and granted!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.userGroups.push(self.nfRegistryService.group);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage buckets privileges updated!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current group from the administrator resources
            for (var resource in this.nfRegistryService.BUCKETS_PRIVS) {
                if (this.nfRegistryService.BUCKETS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.BUCKETS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current group and update it
                                    policy.userGroups = policy.userGroups.filter(function (group) {
                                        return (group.identifier !== self.nfRegistryService.group.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage buckets privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                self.nfRegistryService.group = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        }
    },

    /**
     * Toggles the manage tenants privileges for the group.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleGroupManageTenantsPrivileges: function ($event, policyAction) {
        var self = this;
        if ($event.checked) {
            for (var resource in this.nfRegistryService.TENANTS_PRIVS) {
                if (this.nfRegistryService.TENANTS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.TENANTS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, self.nfRegistryService.group.users, []).subscribe(
                                        function (response) {
                                            // can manage tenants privileges created and granted!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.userGroups.push(self.nfRegistryService.group);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage tenants privileges updated!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current group from the administrator resources
            for (var resource in this.nfRegistryService.TENANTS_PRIVS) {
                if (this.nfRegistryService.TENANTS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.TENANTS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current group and update it
                                    policy.userGroups = policy.userGroups.filter(function (group) {
                                        return (group.identifier !== self.nfRegistryService.group.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage tenants privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                self.nfRegistryService.group = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        }
    },

    /**
     * Toggles the manage policies privileges for the group.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleGroupManagePoliciesPrivileges: function ($event, policyAction) {
        var self = this;
        if ($event.checked) {
            for (var resource in this.nfRegistryService.POLICIES_PRIVS) {
                if (this.nfRegistryService.POLICIES_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.POLICIES_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, self.nfRegistryService.group.users, []).subscribe(
                                        function (response) {
                                            // can manage policies privileges created and granted!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.userGroups.push(self.nfRegistryService.group);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage policies privileges updated!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current group from the administrator resources
            for (var resource in this.nfRegistryService.POLICIES_PRIVS) {
                if (this.nfRegistryService.POLICIES_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.POLICIES_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current group and update it
                                    policy.userGroups = policy.userGroups.filter(function (group) {
                                        return (group.identifier !== self.nfRegistryService.group.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage policies privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                self.nfRegistryService.group = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        }
    },

    /**
     * Toggles the manage proxy privileges for the group.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleGroupManageProxyPrivileges: function ($event, policyAction) {
        var self = this;
        if ($event.checked) {
            for (var resource in this.nfRegistryService.PROXY_PRIVS) {
                if (this.nfRegistryService.PROXY_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.PROXY_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, self.nfRegistryService.group.users, []).subscribe(
                                        function (response) {
                                            // can manage proxy privileges created and granted!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.userGroups.push(self.nfRegistryService.group);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage proxy privileges updated!!!...now update the view
                                            response.userGroups.forEach(function (group) {
                                                if (group.identifier === self.nfRegistryService.group.identifier) {
                                                    self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.group = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current group from the administrator resources
            for (var resource in this.nfRegistryService.PROXY_PRIVS) {
                if (this.nfRegistryService.PROXY_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.PROXY_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 404) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current group and update it
                                    policy.userGroups = policy.userGroups.filter(function (group) {
                                        return (group.identifier !== self.nfRegistryService.group.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage proxy privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier).subscribe(function (response) {
                                                self.nfRegistryService.group = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        }
    },
        /**
     * Update group name.
     *
     * @param groupname
     */
    updateGroupName: function () {
        var groupname=groupnameInput.value;
        this.isEdited=false;
        this.enableEdit=true;
        var self = this;
        this.nfRegistryApi.updateUserGroup(this.nfRegistryService.group.identifier, groupname, this.nfRegistryService.group.users).subscribe(function (response) {
            if (!response.status || response.status === 200) {
                self.nfRegistryService.group = response;
                self.nfRegistryService.groups.filter(function (group) {
                    if (self.nfRegistryService.group.identifier === group.identifier) {
                        group.identity = response.identity;
                    }
                });
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Success',
                    message: 'This group name has been updated.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'success-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
            } else if (response.status === 404) {
                self.nfRegistryService._groupname = self.nfRegistryService.group.identity;
                self.dialogService.openConfirm({
                    title: 'Error',
                    message: 'This group already exists. Please enter a different identity/group name.',
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-warn'
                });
            }
        });
    },
     /**
     * Delete the given user.
     *
     * @param action        The action object.
     */
    deleteSelectedUser: function () {    
     this.executeUserAction('delete',this.nfRegistryService.user);
    },
        /**
     * Execute the given user action.
     *
     * @param action        The action object.
     * @param user          The user object the `action` will act upon.
     */
    executeUserAction: function (action,user) {
        var self = this;
        this.user = user;
        switch (action) {
            case 'delete':
                return this.dialogService.openConfirm({
                    title: 'Delete User',
                    message: 'This user will lose all access to the registry.',
                    cancelButton: 'Cancel',
                    acceptButton: 'Delete',
                    acceptButtonColor: 'fds-regular'
                }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.nfRegistryApi.deleteUser(self.user.identifier).subscribe(function (response) {
                                self.nfRegistryService.users = self.nfRegistryService.users.filter(function (u) {
                                    return u.identifier !== self.user.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'User: ' + self.user.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.isUserPolicy = true;
                                self.isGroupPolicy = false;
                                self.addUserSelection();
                                
                            });
                        }
                    });
                break;
            default:
                break;
        }
    },
    
    /**
     * Delete the given user.
     *
     * @param action        The action object.
     */
    deleteSelectedGroup: function () {    
     this.executeGroupAction('delete',this.nfRegistryService.group);
    },
    
     /**
     * Execute the given group action.
     *
     * @param action        The action object.
     * @param group          The group object the `action` will act upon.
     */
    executeGroupAction: function (action,group) {
        var self = this;
        this.group = group;
        switch (action) {
            case 'delete':
                this.dialogService.openConfirm({
                    title: 'Delete Group',
                    message: 'All policies granted to this group will be deleted as well.',
                    cancelButton: 'Cancel',
                    acceptButton: 'Delete',
                    acceptButtonColor: 'fds-regular'
                }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.nfRegistryApi.deleteUserGroup(self.group.identifier).subscribe(function (response) {
                                self.nfRegistryService.groups = self.nfRegistryService.groups.filter(function (u) {
                                    return u.identifier !== self.group.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'Group: ' + self.group.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.isGroupPolicy = true;
                                self.isUserPolicy = false;
                                self.addGroupSelection();
                            });
                        }
                    });
                break;
            default:
                break;
        }
    },
    /**
     * update Group name
     */
    editUserName: function () {
        var self = this;
        if(this.nfRegistryService.currentUser.resourcePermissions.tenants.canWrite || this.nfRegistryService.group.configurable){
        this.isEdited = true;
        this.enableEdit = false;   
        }
        else{
        self.dialogService.openConfirm({
                    title: 'Error',
                    message: "This user doesn't have permission to rename",
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-warn'
         });   
        }
    },
    addUserSelection:function(){
        var self=this;
        self.selectedUser = self.nfRegistryService.users[0];
        self.nfRegistryService._username = self.nfRegistryService.users[0].identity;
        self.nfRegistryService.user = self.nfRegistryService.users[0];
        self.userPolicies(self.nfRegistryService.users[0]);
        self.nfRegistryService.filterUsersAndGroups();   
    },
    addGroupSelection:function(){
        var self=this;
        self.selectedGroup = self.nfRegistryService.groups[0];
        self.nfRegistryService._groupname =  self.nfRegistryService.groups[0].identity;
        self.userGroupPolicies(self.nfRegistryService.groups[0]);
        self.nfRegistryService.filterUsersAndGroups();   
    },
    
    /**
     * update Group name
     */
    closeEdit: function () {
        this.isEdited = false;
        this.enableEdit = true;
    },
    /**
     * update Group name
     */
    updateUserName: function () {
        var userName=usernameInput.value;
        this.isEdited = false;
        this.enableEdit = true;
        var self = this;
        this.nfRegistryApi.updateUser(this.nfRegistryService.user.identifier, userName).subscribe(function (response) {
            if (!response.status || response.status === 200) {
                self.nfRegistryService.user = response;
                self.nfRegistryService.users.filter(function (user) {
                    if (self.nfRegistryService.user.identifier === user.identifier) {
                        user.identity = response.identity;
                    }
                });
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Success',
                    message: 'This user name has been updated.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'success-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
            } else if (response.status === 409) {
                self.nfRegistryService._username = self.nfRegistryService.user.identity;
                self.dialogService.openConfirm({
                    title: 'Error',
                    message: 'This user already exists. Please enter a different identity/user name.',
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-warn'
                });
            }
        });
    },
     /**
     * Toggles the manage bucket privileges for the user.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleUserManageBucketsPrivileges: function ($event, policyAction) {
        var self = this;
        if($event.checked) {
            for (var resource in this.nfRegistryService.BUCKETS_PRIVS) {
                if (this.nfRegistryService.BUCKETS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.BUCKETS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, [self.nfRegistryService.user], []).subscribe(
                                        function (response) {
                                            // can manage buckets privileges created and granted!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function(response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.users.push(self.nfRegistryService.user);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage buckets privileges updated!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function(response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current user from the /buckets resources
            for (var resource in this.nfRegistryService.BUCKETS_PRIVS) {
                if (this.nfRegistryService.BUCKETS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.BUCKETS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current user and update it
                                    policy.users = policy.users.filter(function (user) {
                                        return (user.identifier !== self.nfRegistryService.user.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage buckets privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function(response) {
                                                self.nfRegistryService.user = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }

        }
    },
    
    /**
     * Toggles the manage tenants privileges for the user.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleUserManageTenantsPrivileges: function ($event, policyAction) {
        var self = this;
        if($event.checked) {
            for (var resource in this.nfRegistryService.TENANTS_PRIVS) {
                if (this.nfRegistryService.TENANTS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.TENANTS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, [self.nfRegistryService.user], []).subscribe(
                                        function (response) {
                                            // can manage tenants privileges created and granted!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.users.push(self.nfRegistryService.user);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage tenants privileges updated!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current user from the administrator resources
            for (var resource in this.nfRegistryService.TENANTS_PRIVS) {
                if (this.nfRegistryService.TENANTS_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.TENANTS_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current user and update it
                                    policy.users = policy.users.filter(function (user) {
                                        return (user.identifier !== self.nfRegistryService.user.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage tenants privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                self.nfRegistryService.user = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }

        }
    },
    /**
     * Toggles the manage policies privileges for the user.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleUserManagePoliciesPrivileges: function ($event, policyAction) {
        var self = this;
        if($event.checked) {
            for (var resource in this.nfRegistryService.POLICIES_PRIVS) {
                if (this.nfRegistryService.POLICIES_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.POLICIES_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, [self.nfRegistryService.user], []).subscribe(
                                        function (response) {
                                            // can manage policies privileges created and granted!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.users.push(self.nfRegistryService.user);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage policies privileges updated!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current user from the administrator resources
            for (var resource in this.nfRegistryService.POLICIES_PRIVS) {
                if (this.nfRegistryService.POLICIES_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.POLICIES_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current user and update it
                                    policy.users = policy.users.filter(function (user) {
                                        return (user.identifier !== self.nfRegistryService.user.identifier) ? true : false;
                                    });
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage policies privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                self.nfRegistryService.user = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }

        }
    },
        /**
     * Toggles the manage proxy privileges for the user.
     *
     * @param $event
     * @param policyAction      The action to be toggled
     */
    toggleUserManageProxyPrivileges: function ($event, policyAction) {
        var self = this;
        if($event.checked) {
            for (var resource in this.nfRegistryService.PROXY_PRIVS) {
                if (this.nfRegistryService.PROXY_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.PROXY_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist, let's create it
                                    self.nfRegistryApi.postPolicyActionResource(action, resource, [self.nfRegistryService.user], []).subscribe(
                                        function (response) {
                                            // can manage proxy privileges created and granted!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                } else {
                                    // resource exists, let's update it
                                    policy.users.push(self.nfRegistryService.user);
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // can manage proxy privileges updated!!!...now update the view
                                            response.users.forEach(function (user) {
                                                if (user.identifier === self.nfRegistryService.user.identifier) {
                                                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                        self.nfRegistryService.user = response;
                                                    });
                                                }
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        } else {
            // Remove the current user from the administrator resources
            for (var resource in this.nfRegistryService.PROXY_PRIVS) {
                if (this.nfRegistryService.PROXY_PRIVS.hasOwnProperty(resource)) {
                    this.nfRegistryService.PROXY_PRIVS[resource].forEach(function (action) {
                        if (!policyAction || (action === policyAction)) {
                            self.nfRegistryApi.getPolicyActionResource(action, resource).subscribe(function (policy) {
                                if (policy.status && policy.status === 409) {
                                    // resource does NOT exist
                                } else {
                                    // resource exists, let's filter out the current user and update it
                                    policy.users = policy.users.filter(function (user) {
                                        return (user.identifier !== self.nfRegistryService.user.identifier) ? true : false;
                                    })
                                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                        policy.resource, policy.users, policy.userGroups).subscribe(
                                        function (response) {
                                            // administrator privileges updated!!!...now update the view
                                            self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier).subscribe(function (response) {
                                                self.nfRegistryService.user = response;
                                            });
                                        });
                                }
                            });
                        }
                    });
                }
            }

        }
    },
     /**
     * Opens a modal dialog UX enabling the addition of this user to multiple groups.
     */
    addUserToGroups: function (action, identifier) {
        this.router.navigateByUrl('/dataintegration-registry/explorer/user(' + action.type + ':' + action.name + '/user/' + identifier + ')');
    },
        /**
     * Remove user from group.
     *
     * @param group
     */
    removeUserFromGroup: function (group) {
        var self = this;
        this.nfRegistryApi.getUserGroup(group.identifier).subscribe(function (response) {
            if (!response.error) {
                var fullGroup = response;
                var users = fullGroup.users.filter(function (user) {
                    if (self.nfRegistryService.user.identifier !== user.identifier) {
                        return user;
                    }
                });
                self.nfRegistryApi.updateUserGroup(fullGroup.identifier, fullGroup.identity, users).subscribe(function (response) {
                    self.nfRegistryApi.getUser(self.nfRegistryService.user.identifier)
                        .subscribe(function (response) {
                            self.nfRegistryService.user = response;
                            self.filterGroups();
                        });
                    var snackBarRef = self.snackBarService.openCoaster({
                        title: 'Success',
                        message: 'This user has been removed from the ' + group.identity + ' group.',
                        verticalPosition: 'bottom',
                        horizontalPosition: 'right',
                        icon: 'success-toaster-icon',
                        color: '#1EB475',
                        duration: 3000
                    });
                });
            }
        });
    },
    
    searchUsersTab: function () {
        var self = this;
        if($("#SearchUsers").val() === ""){
           this.isFilteredUserGroup = false;
        }
        else{
        this.searchTerm = $(".users-search-textbox").val();
        var newUsersData = self.nfRegistryService.users;
        newUsersData = this.dataTableService.filterData(newUsersData, this.searchTerm, true);
        this.nfRegistryService.filteredUsers = newUsersData;
        }  
    },

    searchGroupsTab: function () {
        var self = this;
        if($("#SearchRegistryGroups").val() === ""){
           this.isFilteredRegistryGroup = false;
        }
        this.searchTerm = $("#SearchRegistryGroups").val();
        var newUserGroupsData = self.nfRegistryService.groups;
        newUserGroupsData = this.dataTableService.filterData(newUserGroupsData, this.searchTerm, true);
        this.nfRegistryService.filteredUserGroups = newUserGroupsData;
    },
        searchUserCloseBtn: function () {
        var self = this;
        this.nfRegistryService.filteredUsers = self.nfRegistryService.users;
        $("#SearchUsers").val('');
    },
    
       searchRegistryGroupsCloseBtn: function () {
        var self = this;
        this.nfRegistryService.filteredUserGroups = self.nfRegistryService.groups;
        $("#SearchRegistryGroups").val('');
    },
    
        removeUsersGroupsFilter: function () {
        var self= this;
        if (this.isUser === true) {
             this.nfRegistryService.filteredUsers = self.nfRegistryService.users;
        } else {
            this.nfRegistryService.filteredUserGroups = self.nfRegistryService.groups;
        }

    },
    
    /**
     * Opens a modal dialog UX enabling the addition of users to this group.
     */
    addUsersToGroup: function (action, identifier) {
    this.router.navigateByUrl('/dataintegration-registry/explorer/user(' + action.type + ':' + action.name + '/group/' + identifier + ')');
    },
        /**
     * Remove user from group.
     *
     * @param user
     */
    removeUserFromSelectedGroup: function (user) {
        var self = this;
        var users = this.nfRegistryService.group.users.filter(function (u) {
            if (u.identifier !== user.identifier) {
                return u;
            }
        });

        this.nfRegistryApi.updateUserGroup(this.nfRegistryService.group.identifier, this.nfRegistryService.group.identity, users).subscribe(function (response) {
            self.nfRegistryApi.getUserGroup(self.nfRegistryService.group.identifier)
                .subscribe(function (response) {
                    self.nfRegistryService.group = response;
                    self.filterUsers();
                });
            var snackBarRef = self.snackBarService.openCoaster({
                title: 'Success',
                message: 'The user has been removed from the ' + self.nfRegistryService.group.identity + ' group.',
                verticalPosition: 'bottom',
                horizontalPosition: 'right',
                icon: 'success-toaster-icon',
                color: '#1EB475',
                duration: 3000
            });
        });
    },
     importUsers:function(){
        var self=this;
           //check whether UMS enabled
           var baseUrl = self.nfRegistryService.UMSBaseUrl;
              var clientId="";
              var clientSecret="";
                 self.dialogService.openConfirm({
                    title: 'Import Users',
                    message: "Are you sure you want to import all user(s) from User Management Server?",
                    cancelButton: 'Cancel',
                    acceptButton: 'Ok',
                    acceptButtonColor: 'fds-primary'
                }).afterClosed().subscribe(
                        function (accept) {
                            if (accept) {
                                self.nfRegistryApi.importUMSUsers().subscribe(function (response) {
                                     self.importedUsers=JSON.parse(response);
                                      self.addUMSUsers();    
                                });         
                            }
                        });
    },
    addUMSUsers: function () {
        var self = this;
        var message = "";
        var usersCount = self.importedUsers.length;
        if (usersCount > 0) {
            self.importedUsers.forEach(function (user) {
                self.nfRegistryApi.addUser(user).subscribe(function (response) {
                    self.nfRegistryService.users.push(response);
                    self.nfRegistryService.filterUsersAndGroups();
                });
            });
        }
        if (usersCount === 0) {
            message = "No new users to import from User Management Server";
        } else if (usersCount === 1) {
          message =  usersCount +" User has been imported successfully.";
        }
        else{
            message = usersCount+' User(s) has been imported successfully.';
        }
        self.snackBarService.openCoaster({
            title: 'Success',
            message: message,
            verticalPosition: 'bottom',
            horizontalPosition: 'right',
            icon: 'success-toaster-icon',
            color: '#1EB475',
            duration: 3000
        });
    }
};

NfRegistryUser.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-user.html!text'),
        animations: [nfRegistryAnimations.slideInLeftAnimation],
        host: {
            '[@routeAnimation]': 'routeAnimation'
        }
    })
];

NfRegistryUser.parameters = [
    nfRegistryApi,
    NfStorage,
    NfRegistryService,
    ngRouter.ActivatedRoute,
    fdsDialogsModule.FdsDialogService,
    ngMaterial.MatDialog,
    fdsSnackBarsModule.FdsSnackBarService,
    covalentCore.TdDataTableService,
    ngRouter.Router
    //nfRegistryApi, nfStorage, nfRegistryService, activatedRoute, fdsDialogService, matDialog
];

module.exports = NfRegistryUser;    
    
   
