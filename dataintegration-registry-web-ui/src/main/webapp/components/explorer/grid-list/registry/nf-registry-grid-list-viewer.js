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
var covalentCore = require('@covalent/core');
var rxjs = require('rxjs/Observable');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var NfRegistryCreateBucket = require('nifi-registry/components/administration/workflow/dialogs/create-bucket/nf-registry-create-bucket.js');
var NfRegistryRenameBucket=require('nifi-registry/components/explorer/grid-list/dialog/rename-bucket/nf-registry-rename-bucket.js');
var ngRouter = require('@angular/router');
var ngMaterial = require('@angular/material');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var fdsDialogsModule = require('@fluid-design-system/dialogs');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
/**
 * NfRegistryGridListViewer constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @param nfRegistryApi         The api service.
 * @param activatedRoute        The angular activated route module.
 * @param nfStorage             A wrapper for the browser's local storage.* 
 * @param tdDataTableService    The covalent data table service module.
 * @param matDialog             The angular material dialog module.
 * @constructor
 */
function NfRegistryGridListViewer(nfRegistryService, nfRegistryApi, activatedRoute, nfStorage,tdDataTableService,matDialog,fdsDialogService,router,fdsSnackBarService) {
    this.route = activatedRoute;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dataTableService = tdDataTableService;
    this.dialogService = fdsDialogService;
    this.nfStorage = nfStorage;
    this.dialog = matDialog;
    this.isValid=false;
    this.isManagePermission=false;
    this.isDropletDetails=false;
    this.isDroplets=false;
    this.userPermsSearchTerm='';
    this.bucketPolicies = [];
    this.isEditPermission=false;
    this.isRead=false;
    this.isWrite=false;
    this.isDelete=false;
    this.users = [];
    this.groups = [];
    this.isbucketPoliciesFiltered=false;
    this.userOrGroup = {};
    this.bucketsPoliciesSearchTerm ="";
    this.isFiltered = false;
    this.router = router;
    this.selectedBucket=[];
    this.snackBarService = fdsSnackBarService;
     $(document).click(function (event) {
        if ($("#ums-application-container").css("display") !== "none") {
            if (!event.target.matches('.applicationLogo') && !event.target.matches('.app-tile') &&
                    !event.target.matches('.app-tile-caption') && !event.target.matches('.app-tile-icon')
                    && !event.target.matches('.application-image'))
                $("#ums-application-container").css("display", "none");
        }
    });
};

NfRegistryGridListViewer.prototype = {
    constructor: NfRegistryGridListViewer,

    /**
     * Initialize the component.
     */
    ngOnInit: function () {
        var self = this;
        if(self.nfRegistryService.isLoggedIn() === false)
        {
          self.router.navigateByUrl('dataintegration-registry/login/dataintegration-login'); 
        }
        else {
        this.nfRegistryService.explorerViewType = 'grid-list';
        this.nfRegistryService.inProgress = true;
        // reset the breadcrumb state
        this.nfRegistryService.userIdentitiesWithPolicies = [];
        this.nfRegistryService.groupIdentitiesWithPolicies = [];
        
        //Auto refresh for droplets
//        setInterval(function () {
//            self.refreshDroplets();
//        }, 60000);
//               
        // subscribe to the route params
        this.$subscription = this.route.params
            .switchMap(function (params) {
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getBuckets());
                    self.nfRegistryApi.getPolicies();
            })
            .subscribe(function (response) {
                var buckets = response[0];
                self.nfRegistryService.buckets = buckets;
                self.nfRegistryService.filterBuckets();
                self.nfRegistryService.setBreadcrumbState('in');
                self.nfRegistryService.inProgress = false;
                if(buckets.length>0 && self.nfRegistryService._bucketname === ""){
                self.nfRegistryService._bucketname= buckets[0].name;
                self.showDroplets(buckets[0],true);   
                }
                else{
                self.showDroplets(self.nfRegistryService.bucket,true); 
                }

            });
        }
    },
    /**
     * Destroy the component.
     */
    ngOnDestroy: function () {
        this.nfRegistryService.explorerViewType = '';
        this.nfRegistryService.setBreadcrumbState('out');
        this.nfRegistryService.filteredDroplets = [];
        this.nfRegistryService.filteredBuckets=[];
        this.nfRegistryService.selectedDroplet=[];
        this.nfRegistryService.selectedDropletAuthor="";
        this.$subscription.unsubscribe();
    },
    
     /**
     * Opens the create new bucket dialog.
     */
    createBucket: function () {
        this.dialog.open(NfRegistryCreateBucket, {
            disableClose: true,
             width: '400px'
        });
    },
    /**
     * Opens the rename bucket dialog.
     */
    renameBucket: function (bucket) {
        this.nfRegistryService.bucket.name= bucket.name;
        this.nfRegistryService.bucket.identifier = bucket.identifier;
        this.dialog.open(NfRegistryRenameBucket, {
            disableClose: true,
             width: '400px'
        });
    },
    /**
     * Opens the create new bucket dialog.
     */
    showDroplets: function (bucket,isFirstTime) {
        var canShowDroplets=false;
        if(isFirstTime){
         canShowDroplets = true;   
        }
        else if(!event.target.classList.contains("menu-container")){
          canShowDroplets = true;
        }
        if(canShowDroplets){
        var self = this;
        this.isManagePermission=false;
        this.isDropletDetails=false;
        this.isDroplets=true;
        self.nfRegistryService.bucket = bucket;
        // subscribe to the route params
        this.$subscription = this.route.params
            .switchMap(function (params) {
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getDroplets(bucket.identifier),
                );
            })
            .subscribe(function (response) {
                var droplets = response[0];
                self.nfRegistryService.droplets = droplets;
                self.nfRegistryService.filterDroplets();
                if(droplets.length>0){
                if(self.nfRegistryService.dropletSelected === ""){
                self.nfRegistryService._dropletname= droplets[0].name;
                self.nfRegistryService.dropletSelected=droplets[0]; //To maintain droplet while switching tabs
                self.showDropletDetails(droplets[0]);   
                }    
                 else{
                 self.showDropletDetails(self.nfRegistryService.dropletSelected);  //show droplet selected while switching tabs 
                 } 
                }

            });
        }
    },
    closePermissionTab:function(){
      this.showDroplets(this.nfRegistryService.bucket,true);
    },
        /**
     * Opens the flow details tab.
     */
    showDropletDetails: function (droplet) {
            var self = this;
            self.nfRegistryService.selectedDroplet=[droplet];
            self.nfRegistryService._dropletname= droplet.name;
            this.isDropletDetails=true;
            this.isManagePermission=false;
            self.nfRegistryService.getDropletSnapshotMetadata(droplet);
    },
    refreshDroplets:function(){
        if(this.nfRegistryService.selectedTab !== 'users'){
          var self = this;
        // subscribe to the route params
        this.$subscription = this.route.params
            .switchMap(function (params) {
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getDroplets(self.nfRegistryService.bucket.identifier),
                );
            })
            .subscribe(function (response) {
                var droplets = response[0];
                self.nfRegistryService.droplets = droplets;
                var updateVersionCount =  droplets[0].versionCount;
                $("#droplets-vesion-count").text("Versions:" + updateVersionCount);
                self.nfRegistryService.filterDroplets();
                if(self.isDropletDetails){
                   self.nfRegistryService.getDropletSnapshotMetadata(self.nfRegistryService.selectedDroplet[0]);   
                }
            });    
        }

    },
     /**
     * manages the permission of buckets.
     */
    manageBucketPermissions:function(bucket){
            this.isEditPermission=false;
            this.isManagePermission=true;
            this.isDroplets=false;
            this.isDropletDetails=false;
            var self = this;
            self.nfRegistryService.bucket = bucket;
            self.nfRegistryService._bucketname = bucket.name;
            self.nfRegistryService.userPerms = {};
            self.nfRegistryService.groupPerms = {};
            self.nfRegistryService.filteredGroupPermsData = [];
            self.nfRegistryService.filteredUserPermsData = [];
            self.nfRegistryService.userIdentitiesWithPolicies = [];
            self.nfRegistryService.groupIdentitiesWithPolicies = [];
          this.$subscription = this.route.params
            .switchMap(function (params) {
                return new rxjs.Observable.forkJoin(
                    self.nfRegistryApi.getPolicies()
                );
            })
            .subscribe(function (response) {
                if (!self.nfRegistryService.currentUser.anonymous) {
                    if (!response[0].error) {
                        var policies = response[0];
                        policies.forEach(function (policy) {
                            if (policy.resource.indexOf("/buckets/" + self.nfRegistryService.bucket.identifier) >= 0) {
                                self.bucketPolicies.push(policy);
                                policy.users.forEach(function (user) {
                                    var userActionsForBucket = self.nfRegistryService.userPerms[user.identity] || [];
                                    userActionsForBucket.push(policy.action);
                                     self.nfRegistryService.userPerms[user.identity] = userActionsForBucket;

                                });
                                policy.userGroups.forEach(function (group) {
                                    var groupActionsForBucket = self.nfRegistryService.groupPerms[group.identity] || [];
                                    groupActionsForBucket.push(policy.action);
                                     self.nfRegistryService.groupPerms[group.identity] = groupActionsForBucket;

                                });
                            }
                        });
                        self.nfRegistryService.filterPolicies();
                    }
                }
            });
    },
    executeDeleteAction: function (type, element) {
        var self = this;
        if (type.toLowerCase() === 'bucket') {
            this.dialogService.openConfirm({
                title: 'Delete Bucket',
                message: 'All items stored in this bucket will be deleted as well.',
                cancelButton: 'Cancel',
                acceptButton: 'Delete',
                acceptButtonColor: 'fds-regular'
            }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.nfRegistryService.api.deleteBucket(element.identifier).subscribe(function (response) {
                                self.nfRegistryService.buckets = self.nfRegistryService.buckets.filter(function (b) {
                                    return b.identifier !== element.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'All versions of all items in this bucket, as well as the bucket, have been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.nfRegistryService.bucket = {};
                                self.nfRegistryService.filterBuckets();
                                self.isManagePermission = false;
                                self.isDroplets = false;
                                self.isDropletDetails = false;
                            });
                        }
                    });
        } else if (type.toLowerCase() === 'droplet') {
            this.dialogService.openConfirm({
                title: 'Delete ' + element.type.toLowerCase(),
                message: 'All versions of this ' + element.type.toLowerCase() + ' will be deleted.',
                cancelButton: 'Cancel',
                acceptButton: 'Delete',
                acceptButtonColor: 'fds-regular'
            }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.nfRegistryService.api.deleteDroplet(element.link.href).subscribe(function (response) {
                                self.nfRegistryService.droplets = self.nfRegistryService.droplets.filter(function (d) {
                                    return (d.identifier !== element.identifier) ? true : false
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'All versions of this ' + element.type.toLowerCase() + ' have been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.nfRegistryService.droplet = {};
                                self.nfRegistryService.filterDroplets();
                                self.isDropletDetails = false;
                            });
                        }
                    });
        }
    },
    
   /**
     * Opens a modal dialog to add policies to bucket
     */
    addBucketPolicies: function (action, identifier) {
    var self = this;
    this.router.navigateByUrl('/dataintegration-registry/explorer/grid-list(' + action.type + ':' + action.name + '/bucket/' + identifier + ')');
    self.nfRegistryService.userGroupPermissionTab = 'user';
    },
    allFilteredBucketsSelected: function (selectedBucket) {
        this.nfRegistryService._bucketname= selectedBucket.name;
        this.nfRegistryService.filteredBuckets.forEach(function (bucket) {
            if(selectedBucket===bucket){
               bucket.checked=true; 
            }
            else if (bucket.checked) {
                bucket.checked=false;
            }
        });
    },
    allFilteredDropletSelected: function (selectedDroplet) {
        this.selectedDroplet=selectedDroplet;
        this.nfRegistryService.dropletSelected=selectedDroplet; //To maintain droplet while switching tabs
        this.nfRegistryService.filteredDroplets.forEach(function (droplet) {
            if (selectedDroplet === droplet) {
                droplet.checked = true;
            } else if (droplet.checked) {
                droplet.checked = false;
            }
        });
    },
    
    searchBucketPolicies:function(){
        this.bucketsPoliciesSearchTerm = $(".search-user-policies-textbox").val();
        if(this.bucketsPoliciesSearchTerm === ''){
         this.isFiltered = false;
         this.isbucketPoliciesFiltered = false;    
        }
        else{
        this.isbucketPoliciesFiltered = true; 
        }
        var newGroupData =  this.nfRegistryService.groupPermsData;
        newGroupData = this.dataTableService.filterData(newGroupData, this.bucketsPoliciesSearchTerm, true);
        this.nfRegistryService.filteredGroupPermsData = newGroupData;  
        var newUserData = this.nfRegistryService.userPermsData;
        newUserData = this.dataTableService.filterData(newUserData, this.bucketsPoliciesSearchTerm, true);
        this.nfRegistryService.filteredUserPermsData = newUserData; 
      
    },
    
    searchCloseBtn:function(){
         this.nfRegistryService.filteredGroupPermsData = this.nfRegistryService.groupPermsData;
         this.nfRegistryService.filteredUserPermsData = this.nfRegistryService.userPermsData;
         $("#permission-search-box").val('');
    },
    
    openEditPolicy: function (userOrGroup) {
        var self = this;
        this.isEditPermission = true;
        this.nfRegistryService.selectedIdentity = userOrGroup.identity;
        userOrGroup.isEdited = true;
        var permissions = userOrGroup.permissions.split("  ");
        permissions.forEach(function (permission) {
            if (permission.trim() === 'read') {
                self.isRead = true;
            }
            if (permission.trim() === 'write') {
                self.isWrite = true;
            }
            if (permission.trim() === 'delete') {
                self.isDelete = true;
            }
        });
        self.nfRegistryService.filterPolicies();
    },
    closeEditPolicy: function (userOrGroup) {
        var self = this;
        this.isEditPermission = false;
        this.nfRegistryService.selectedIdentity = "";
        userOrGroup.isEdited = false;
         self.isRead = false;
         self.isWrite = false;
         self.isDelete = false;
       self.nfRegistryService.filterPolicies();
    },
     /**
     * Sort `groups` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortUsers: function (column) {
        if (column.sortable) {
            var sortBy = column.name;
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
             this.nfRegistryService.filterPolicies(sortBy, sortOrder);

            //only one column can be actively sorted so we reset all to inactive
            this.nfRegistryService.bucketPoliciesColumns.forEach(function (c) {
                c.active = false;
            });
            //and set this column as the actively sorted column
            column.active = true;
        }
    },
    /**
     * Update a new policy.
     */
    saveEditedPolicy: function (selectedUserOrGroup) {
        var self = this;
        var action = '';
                this.route.params
                .switchMap(function (params) {
                    return new rxjs.Observable.forkJoin(
                            self.nfRegistryApi.getUsers(),
                            self.nfRegistryApi.getUserGroups()
                            );
                })
                .subscribe(function (response) {
                    var users = response[0];
                    var groups = response[1];
                    users = users.filter(function (user) {
                        return (selectedUserOrGroup.identity === user.identity) ? true : false;
                    });
                    if (users.length === 0) {
                        groups = groups.filter(function (group) {
                            return (selectedUserOrGroup.identity === group.identity) ? true : false;
                        });
                        self.userOrGroup = groups[0];
                        self.userOrGroup.type = 'group';
                    } else {
                        self.userOrGroup = users[0];
                        self.userOrGroup.type = 'user';
                    }
                    self.nfRegistryService.selectedIdentity = selectedUserOrGroup.identity;
        selectedUserOrGroup.isEdited = true;
        var permissions = selectedUserOrGroup.permissions.split("  ");
        var resource = '/buckets';
        var permissions = [];
        if (self.isRead) {
            action = 'read';
            permissions.push(action);
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'read';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist, let's create it
                    var users = [];
                    var groups = [];
                    if (self.userOrGroup.type === 'user') {
                        users.push(self.userOrGroup);
                    } else {
                        groups.push(self.userOrGroup);
                    }

                    self.nfRegistryApi.postPolicyActionResource(action, resource + '/' + self.nfRegistryService.bucket.identifier, users, groups).subscribe(
                            function (response) {
                                // policy created!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                } else {
                    // resource exists, let's update it
                    if (self.userOrGroup.type === 'user') {
                        policy.users.push(self.userOrGroup);
                    } else {
                        policy.userGroups.push(self.userOrGroup);
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        } else {
            action = 'read';
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'read';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist so we have nothing to do
                } else {
                    // resource exists, let's remove it
                    if (self.userOrGroup.type === 'user') {
                        policy.users = policy.users.filter(function (user) {
                            return (self.userOrGroup.identity !== user.identity) ? true : false;
                        });
                    } else {
                        policy.userGroups = policy.userGroups.filter(function (group) {
                            return (self.userOrGroup.identity !== group.identity) ? true : false;
                        });
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        }
        if (self.isWrite) {
            action = 'write';
            permissions.push(action);
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'write';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist, let's create it
                    var users = [];
                    var groups = [];
                    if (self.userOrGroup.type === 'user') {
                        users.push(self.userOrGroup);
                    } else {
                        groups.push(self.userOrGroup);
                    }

                    self.nfRegistryApi.postPolicyActionResource(action, resource + '/' + self.nfRegistryService.bucket.identifier, users, groups).subscribe(
                            function (response) {
                                // policy created!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                } else {
                    // resource exists, let's update it
                    if (self.userOrGroup.type === 'user') {
                        policy.users.push(self.userOrGroup);
                    } else {
                        policy.userGroups.push(self.userOrGroup);
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        } else {
            action = 'write';
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'write';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist so we have nothing to do
                } else {
                    // resource exists, let's remove it
                    if (self.userOrGroup.type === 'user') {
                        policy.users = policy.users.filter(function (user) {
                            return (self.userOrGroup.identity !== user.identity) ? true : false;
                        });
                    } else {
                        policy.userGroups = policy.userGroups.filter(function (group) {
                            return (self.userOrGroup.identity !== group.identity) ? true : false;
                        });
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        }
        if (self.isDelete) {
            action = 'delete';
            permissions.push(action);
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'delete';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist, let's create it
                    var users = [];
                    var groups = [];
                    if (self.userOrGroup.type === 'user') {
                        users.push(self.userOrGroup);
                    } else {
                        groups.push(self.userOrGroup);
                    }

                    self.nfRegistryApi.postPolicyActionResource(action, resource + '/' + self.nfRegistryService.bucket.identifier, users, groups).subscribe(
                            function (response) {
                                // policy created!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                } else {
                    // resource exists, let's update it
                    if (self.userOrGroup.type === 'user') {
                        policy.users.push(self.userOrGroup);
                    } else {
                        policy.userGroups.push(self.userOrGroup);
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        } else {
            action = 'delete';
            self.nfRegistryApi.getResourcePoliciesById(action, resource, self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                action = 'delete';
                if (policy.status && policy.status === 404) {
                    // resource does NOT exist so we have nothing to do
                } else {
                    // resource exists, let's remove it
                    if (self.userOrGroup.type === 'user') {
                        policy.users = policy.users.filter(function (user) {
                            return (self.userOrGroup.identity !== user.identity) ? true : false;
                        });
                    } else {
                        policy.userGroups = policy.userGroups.filter(function (group) {
                            return (self.userOrGroup.identity !== group.identity) ? true : false;
                        });
                    }
                    self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                            policy.resource, policy.users, policy.userGroups).subscribe(
                            function (response) {
                                // policy updated!!!...now update the view
                                self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier).subscribe(function (response) {
                                    self.nfRegistryService.bucket = response;
                                });
                            });
                }
            });
        }
        var dialogResult = {userOrGroup: self.userOrGroup, permissions: permissions};
        self.nfRegistryApi.getBucket(self.nfRegistryService.bucket.identifier)
                .subscribe(function (response) {
                    self.nfRegistryService.bucket = response;
                    self.nfRegistryService._bucketname = response.name;
                    if (dialogResult) {
                        if (dialogResult.userOrGroup.type === 'user') {
                            self.nfRegistryService.userPerms[dialogResult.userOrGroup.identity] = dialogResult.permissions;
                        } else {
                            self.nfRegistryService.groupPerms[dialogResult.userOrGroup.identity] = dialogResult.permissions;
                        }
                        var snackBarRef = self.snackBarService.openCoaster({
                            title: 'Success',
                            message: 'The policy has been updated for this user/group.',
                            verticalPosition: 'bottom',
                            horizontalPosition: 'right',
                            icon: 'success-toaster-icon',
                            color: '#1EB475',
                            duration: 3000
                        });
                    }
                    self.isEditPermission = false;
                    self.nfRegistryService.selectedIdentity = "";
                    self.nfRegistryService.filterPolicies();
                });
                });
        
    },
/**
     * Remove user from group.
     *
     * @param group
     */
    removePolicyFromBucket: function (userOrGroup) {
        var self = this;
        this.dialogService.openConfirm({
            title: 'Delete Policy',
            message: 'All permissions granted by this policy will be removed for this user/group.',
            cancelButton: 'Cancel',
            acceptButton: 'Delete',
            acceptButtonColor: 'fds-regular'
        }).afterClosed().subscribe(
            function (accept) {
                if (accept) {
                    userOrGroup.permissions.split(' ').forEach(function (action) {
                        self.nfRegistryApi.getPolicyActionResource(action, '/buckets/' + self.nfRegistryService.bucket.identifier).subscribe(function (policy) {
                            if (policy.status && policy.status === 404) {
                                // resource does NOT exist
                            } else {
                                // resource exists, let's filter out the current group and update it
                                policy.users = policy.users.filter(function (user) {
                                    return (user.identity !== userOrGroup.identity) ? true : false;
                                });
                                policy.userGroups = policy.userGroups.filter(function (group) {
                                    return (group.identity !== userOrGroup.identity) ? true : false;
                                });
                                self.nfRegistryApi.putPolicyActionResource(policy.identifier, policy.action,
                                    policy.resource, policy.users, policy.userGroups).subscribe(
                                    function (response) {
                                        // policy removed!!!...now update the view
                                        self.nfRegistryApi.getPolicies().subscribe(function (response) {
                                            self.nfRegistryService.userPerms = {};
                                            self.nfRegistryService.groupPerms = {};
                                            self.nfRegistryService.filteredGroupPermsData = [];
                                            self.nfRegistryService.filteredUserPermsData = [];
                                            self.nfRegistryService.userIdentitiesWithPolicies = [];
                                            self.nfRegistryService.groupIdentitiesWithPolicies = [];
                                            var policies = response;
                                            policies.forEach(function (policy) {
                                                if (policy.resource.indexOf("/buckets/" + self.nfRegistryService.bucket.identifier) >= 0) {
                                                    self.bucketPolicies.push(policy);
                                                    policy.users.forEach(function (user) {
                                                        var userActionsForBucket = self.nfRegistryService.userPerms[user.identity] || [];
                                                        userActionsForBucket.push(policy.action);
                                                        self.nfRegistryService.userPerms[user.identity] = userActionsForBucket;

                                                    });
                                                    policy.userGroups.forEach(function (group) {
                                                        var groupActionsForBucket = self.nfRegistryService.groupPerms[group.identity] || [];
                                                        groupActionsForBucket.push(policy.action);
                                                        self.nfRegistryService.groupPerms[group.identity] = groupActionsForBucket;

                                                    });
                                                }
                                            });
                                            self.nfRegistryService.filterPolicies();
                                            var snackBarRef = self.snackBarService.openCoaster({
                                                title: 'Success',
                                                message: 'All permissions granted by this policy have be removed for this user/group.',
                                                verticalPosition: 'bottom',
                                                horizontalPosition: 'right',
                                                icon: 'success-toaster-icon',
                                                color: '#1EB475',
                                                duration: 3000
                                            });
                                        });
                                    });
                            }
                        });
                    });
                }
            });
    }
    
};

NfRegistryGridListViewer.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-grid-list-viewer.html!text'),
        animations: [nfRegistryAnimations.flyInOutAnimation]
    })
];

NfRegistryGridListViewer.parameters = [
    NfRegistryService,
    NfRegistryApi,
    ngRouter.ActivatedRoute,
    NfStorage,
    covalentCore.TdDataTableService,
    ngMaterial.MatDialog,
    fdsDialogsModule.FdsDialogService,
    ngRouter.Router,
   fdsSnackBarsModule.FdsSnackBarService
];

module.exports = NfRegistryGridListViewer;
